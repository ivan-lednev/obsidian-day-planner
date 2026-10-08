import type { Attachment } from "svelte/attachments";
import { on } from "svelte/events";
import { isNotVoid } from "typed-assert";

import { getPointerOffsetY } from "../../util/dom";

/**
 * Pairs a grip with the container it resizes. Useful when the grip lives
 * outside of that container, so the two cannot share a single element.
 */
export function createResizeState() {
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
      `Failed to resize a container. Either the attachment hasn't been passed to a container, or the container got destroyed.`,
    );

    const newHeight = getPointerOffsetY(resizeContainerEl, event);

    resizeContainerEl.style.height = `${newHeight}px`;
  }

  const resizeContainer: Attachment<HTMLElement> = (el) => {
    resizeContainerEl = el;

    const cleanUpCallbacks = [
      on(document, "mousemove", handleMove),
      on(document, "touchmove", handleMove),
      on(document, "mouseup", stopResizing, { capture: true }),
      on(document, "touchend", stopResizing, { capture: true }),
      on(document, "touchcancel", stopResizing, { capture: true }),
      on(window, "blur", handleBlur),
    ];

    return () => {
      resizeContainerEl = undefined;
      cleanUpCallbacks.forEach((cleanUp) => cleanUp());
    };
  };

  return {
    startResizing,
    resizeContainer,
  };
}
