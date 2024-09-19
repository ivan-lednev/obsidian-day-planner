import {
  autoUpdate,
  computePosition,
  type ComputePositionConfig,
} from "@floating-ui/dom";
import type { SvelteComponentTyped } from "svelte";
import { writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { isEventRelated, isTapOutside, isTouchEvent } from "../../util/util";

export interface FloatingUiOptions<Props extends Record<string, unknown>> {
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

    return {
      destroy() {
        anchor = null;
      },
    };
  }

  function floatingUiSetup(el: HTMLElement) {
    floatingUi = el;

    isNotVoid(
      anchor,
      "Cannot initialize floating UI before obtaining a reference to anchor.",
    );

    const cleanUpAutoUpdate = autoUpdate(anchor, floatingUi, () => {
      isNotVoid(anchor);
      isNotVoid(floatingUi);

      computePosition(anchor, floatingUi, options).then(({ x, y }) => {
        isNotVoid(floatingUi);

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
