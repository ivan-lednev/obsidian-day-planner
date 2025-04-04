import { on } from "svelte/events";
import { isNotVoid } from "typed-assert";

import { getIsomorphicClientY } from "../../util/dom";

export function createResizeAction() {
  const onDestroyCallbacks: Array<() => void> = [];
  let resizeContainerEl: HTMLElement | undefined;
  let editingHeight = false;

  function startResizing() {
    editingHeight = true;
  }

  function stopResizing(event: MouseEvent | TouchEvent) {
    if (!editingHeight) {
      return;
    }

    event.stopPropagation();
    editingHeight = false;
  }

  function handleBlur() {
    editingHeight = false;
  }

  function handleMove(event: MouseEvent | TouchEvent) {
    if (!editingHeight) {
      return;
    }

    isNotVoid(
      resizeContainerEl,
      `Failed to resize a container. Either an action function hasn't been passed to a container, or the container got destroyed.`,
    );

    const viewportToElOffsetY = resizeContainerEl.getBoundingClientRect().top;
    const newHeight = getIsomorphicClientY(event) - viewportToElOffsetY;

    resizeContainerEl.style.height = `${newHeight}px`;
  }

  onDestroyCallbacks.push(
    on(document, "mousemove", handleMove),
    on(document, "touchmove", handleMove),
    on(document, "mouseup", stopResizing, { capture: true }),
    on(document, "touchend", stopResizing, { capture: true }),
    on(document, "touchcancel", stopResizing, { capture: true }),
    on(window, "blur", handleBlur),
  );

  function resizeAction(el: HTMLElement) {
    resizeContainerEl = el;

    return {
      destroy() {
        resizeContainerEl = undefined;
        onDestroyCallbacks.forEach((callback) => callback());
      },
    };
  }

  return {
    startResizing,
    resizeAction,
  };
}
