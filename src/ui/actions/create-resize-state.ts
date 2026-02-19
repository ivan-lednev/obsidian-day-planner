import { on } from "svelte/events";
import { isNotVoid } from "typed-assert";

import { getPointerOffsetY } from "../../util/dom";

/**
 * This action is useful for cases when we need a resize grip that is outside
 * the resize container.
 */
export function createResizeState() {
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

    const newHeight = getPointerOffsetY(resizeContainerEl, event);

    resizeContainerEl.style.height = `${newHeight}px`;
  }

  function resizeAction(el: HTMLElement) {
    resizeContainerEl = el;

    onDestroyCallbacks.push(
      on(document, "mousemove", handleMove),
      on(document, "touchmove", handleMove),
      on(document, "mouseup", stopResizing, { capture: true }),
      on(document, "touchend", stopResizing, { capture: true }),
      on(document, "touchcancel", stopResizing, { capture: true }),
      on(window, "blur", handleBlur),
    );

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
