import {
  autoUpdate,
  computePosition,
  ComputePositionConfig,
} from "@floating-ui/dom";
import type { SvelteComponentTyped } from "svelte";
import { writable } from "svelte/store";
import TinyGesture from "tinygesture";

import { isEventRelated, isTapOutside, isTouchEvent } from "../../util/util";

export interface FloatingUiOptions<Props> {
  when: boolean;
  Component: typeof SvelteComponentTyped<Props>;
  props: Props;
  options: Partial<ComputePositionConfig>;
}

export function useFloatingUi(options: Partial<ComputePositionConfig>) {
  let anchor: HTMLElement | null = null;
  let floatingUi: HTMLElement | null = null;

  const isActive = writable(false);

  function handleFloatingUiPointerLeave(event: PointerEvent) {
    if (isTouchEvent(event) || isEventRelated(event, anchor)) {
      return;
    }

    isActive.set(false);
  }

  function handleAnchorPointerEnter(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    isActive.set(true);
  }

  function handleAnchorPointerLeave(event: PointerEvent) {
    if (isTouchEvent(event) || isEventRelated(event, floatingUi)) {
      return;
    }

    isActive.set(false);
  }

  function handleFloatingUiTapOutside(event: PointerEvent) {
    if (isTapOutside(event, floatingUi)) {
      isActive.set(false);
    }
  }

  function anchorSetup(el: HTMLElement) {
    anchor = el;

    const gesture = new TinyGesture(el);

    gesture.on("longpress", () => {
      navigator.vibrate(100);
      isActive.set(true);
    });

    return {
      destroy() {
        gesture.destroy();
        anchor = null;
      },
    };
  }

  function floatingUiSetup(el: HTMLElement) {
    floatingUi = el;

    if (!anchor) {
      throw new Error(
        "Cannot initialize floating UI before obtaining a reference to anchor.",
      );
    }

    const cleanUpAutoUpdate = autoUpdate(anchor, floatingUi, () => {
      computePosition(anchor, floatingUi, options).then(({ x, y }) => {
        Object.assign(floatingUi.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    });

    return {
      destroy() {
        cleanUpAutoUpdate();
        floatingUi = null;
      },
    };
  }

  return {
    handleFloatingUiTapOutside,
    handleFloatingUiPointerLeave,
    handleAnchorPointerEnter,
    handleAnchorPointerLeave,
    anchorSetup,
    floatingUiSetup,
    isActive,
  };
}
