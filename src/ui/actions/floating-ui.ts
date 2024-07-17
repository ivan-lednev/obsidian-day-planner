import {
  autoUpdate,
  computePosition,
  ComputePositionConfig,
} from "@floating-ui/dom";
import type { SvelteComponentTyped } from "svelte";
import { get, writable } from "svelte/store";
import TinyGesture from "tinygesture";

import {
  addFadeTransition,
  cancelFadeTransition,
  isEventRelated,
  isTapOutside,
  isTouchEvent,
} from "../../util/util";

interface FloatingUiOptions<Props> {
  when: boolean;
  Component: typeof SvelteComponentTyped<Props>;
  props: Props;
  options: Partial<ComputePositionConfig>;
}

export function floatingUi<Props>(
  anchor: HTMLElement,
  options: FloatingUiOptions<Props>,
) {
  let floatingUiWrapper: HTMLDivElement;
  let componentInstance: SvelteComponentTyped<Props>;
  let cleanUpAutoUpdate: () => void;
  let isFloatingUiInitialized = false;
  let currentOptions = options;

  const isActive = writable(false);

  function handleFloatingUiPointerLeave(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    if (!isEventRelated(event, anchor)) {
      isActive.set(false);
    }
  }

  function handleAnchorPointerEnter(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    isActive.set(true);
    initFloatingUi();
  }

  function handleAnchorPointerLeave(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    if (!isEventRelated(event, floatingUiWrapper)) {
      isActive.set(false);
    }
  }

  function handleTapOutsideFloatingUi(event: PointerEvent) {
    if (isTapOutside(event, floatingUiWrapper)) {
      isActive.set(false);
    }
  }

  function initFloatingUi() {
    if (isFloatingUiInitialized) {
      return;
    }

    isFloatingUiInitialized = true;

    floatingUiWrapper = document.createElement("div");

    floatingUiWrapper.addEventListener(
      "pointerleave",
      handleFloatingUiPointerLeave,
    );

    document.body.appendChild(floatingUiWrapper);
    document.body.addEventListener("pointerdown", handleTapOutsideFloatingUi);

    Object.assign(floatingUiWrapper.style, {
      position: "absolute",
      width: "max-content",
      top: 0,
      left: 0,
      "z-index": 9999,
    });

    componentInstance = new currentOptions.Component({
      target: floatingUiWrapper,
      props: currentOptions.props,
      intro: true,
    });

    cleanUpAutoUpdate = autoUpdate(anchor, floatingUiWrapper, () => {
      computePosition(anchor, floatingUiWrapper, currentOptions.options).then(
        ({ x, y }) => {
          Object.assign(floatingUiWrapper.style, {
            left: `${x}px`,
            top: `${y}px`,
          });
        },
      );
    });
  }

  function destroyFloatingUi() {
    if (!isFloatingUiInitialized) {
      return;
    }

    addFadeTransition(floatingUiWrapper);

    floatingUiWrapper.addEventListener(
      "transitionend",
      () => {
        if (!isFloatingUiInitialized) {
          return;
        }

        isFloatingUiInitialized = false;

        cleanUpAutoUpdate();

        floatingUiWrapper.removeEventListener(
          "pointerleave",
          handleFloatingUiPointerLeave,
        );

        componentInstance.$destroy();

        document.body.removeChild(floatingUiWrapper);
        document.body.removeEventListener(
          "pointerdown",
          handleTapOutsideFloatingUi,
        );
      },
      { once: true },
    );
  }

  const anchorGesture = new TinyGesture(anchor);

  anchorGesture.on("longpress", () => {
    navigator.vibrate(100);
    isActive.set(true);
  });

  anchor.addEventListener("pointerenter", handleAnchorPointerEnter);
  anchor.addEventListener("pointerleave", handleAnchorPointerLeave);

  window.addEventListener("blur", handleAnchorPointerLeave);

  const unsubscribeFromIsActiveStore = isActive.subscribe((newValue) => {
    if (newValue) {
      if (isFloatingUiInitialized) {
        cancelFadeTransition(floatingUiWrapper);
      } else {
        initFloatingUi();
      }
    } else {
      destroyFloatingUi();
    }
  });

  return {
    destroy() {
      destroyFloatingUi();
      unsubscribeFromIsActiveStore();
      anchorGesture.destroy();

      anchor.removeEventListener("pointerenter", handleAnchorPointerEnter);
      anchor.removeEventListener("pointerleave", handleAnchorPointerLeave);

      window.removeEventListener("blur", handleAnchorPointerLeave);
    },
    update(options: FloatingUiOptions<Props>) {
      currentOptions = options;

      if (currentOptions.when && get(isActive)) {
        if (isFloatingUiInitialized) {
          componentInstance?.$set(currentOptions.props);
        } else {
          initFloatingUi();
        }
      } else {
        destroyFloatingUi();
      }
    },
  };
}
