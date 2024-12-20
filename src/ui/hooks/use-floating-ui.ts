import {
  autoUpdate,
  computePosition,
  type ComputePositionConfig,
} from "@floating-ui/dom";
import { isNotVoid } from "typed-assert";

export interface FloatingUiOptions {
  options: Partial<ComputePositionConfig>;
}

export function useFloatingUi(options: Partial<ComputePositionConfig>) {
  let anchor: HTMLElement | null = null;
  let floatingUi: HTMLElement | null = null;

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
    anchorSetup,
    floatingUiSetup,
  };
}
