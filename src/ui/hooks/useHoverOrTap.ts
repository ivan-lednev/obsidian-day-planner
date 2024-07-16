import { get, writable } from "svelte/store";

import { isTouchEvent } from "../../util/util";

export function useHoverOrTap() {
  const isActive = writable(false);

  function handlePointerDown(event: PointerEvent) {
    if (isTouchEvent(event) && !get(isActive)) {
      event.stopPropagation();

      isActive.set(true);
    }
  }

  function handlePointerEnter(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    isActive.set(true);
  }

  return {
    isActive,
    handlePointerDown,
    handlePointerEnter,
  };
}
