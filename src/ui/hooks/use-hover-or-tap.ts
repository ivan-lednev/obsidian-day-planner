import { get, writable } from "svelte/store";

import { isTouchEvent } from "../../util/util";

export function useHoverOrTap() {
  const isActive = writable(false);

  function handlePointerDown(event: PointerEvent) {
    if (isTouchEvent(event) && !get(isActive)) {
      isActive.set(true);
    }
  }

  function handlePointerEnter(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    isActive.set(true);
  }

  function handlePointerLeave(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    isActive.set(false);
  }

  return {
    isActive,
    handlePointerDown,
    handlePointerEnter,
    handlePointerLeave,
  };
}
