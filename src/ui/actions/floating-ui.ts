import {
  autoUpdate,
  computePosition,
  ComputePositionConfig,
} from "@floating-ui/dom";
import type { SvelteComponentTyped } from "svelte";
import { get, writable } from "svelte/store";
import TinyGesture from "tinygesture";

import { isTouchEvent } from "../../util/util";

interface FloatingUiOptions<Props> {
  when: boolean;
  Component: typeof SvelteComponentTyped<Props>;
  props: Props;
  options: Partial<ComputePositionConfig>;
}

function isEventRelated(event: PointerEvent, otherNode: HTMLElement) {
  return (
    event.relatedTarget &&
    (event.relatedTarget === otherNode ||
      (event.relatedTarget instanceof Node &&
        otherNode.contains(event.relatedTarget)))
  );
}

function cancelFadeTransition(el: HTMLElement) {
  Object.assign(el.style, {
    transition: "none",
    opacity: 1,
  });
}

export function floatingUi<Props>(
  anchor: HTMLElement,
  options: FloatingUiOptions<Props>,
) {
  let floatingUiWrapper: HTMLDivElement;
  let componentInstance: SvelteComponentTyped<Props>;
  let cleanUpAutoUpdate: () => void;
  let initialized = false;
  let currentOptions = options;

  const isActive = writable(false);

  function handleFloatingUiPointerLeave(event: PointerEvent) {
    if (isTouchEvent(event)) {
      return;
    }

    if (anchor && !isEventRelated(event, anchor)) {
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

    if (floatingUiWrapper && !isEventRelated(event, floatingUiWrapper)) {
      isActive.set(false);
    }
  }

  function handleTapOutsideFloatingUi(event: PointerEvent) {
    if (
      isTouchEvent(event) &&
      event.target !== floatingUiWrapper &&
      event.target instanceof Node &&
      !floatingUiWrapper.contains(event.target)
    ) {
      isActive.set(false);
    }
  }

  function initFloatingUi() {
    if (initialized || !currentOptions.when) {
      return;
    }

    initialized = true;

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
    if (!initialized) {
      return;
    }

    Object.assign(floatingUiWrapper.style, {
      transition: "opacity 200ms",
      opacity: 0,
    });

    floatingUiWrapper.addEventListener("transitionend", () => {
      if (!initialized) {
        return;
      }

      initialized = false;

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
    });
  }

  const anchorGesture = new TinyGesture(anchor);

  anchorGesture.on("longpress", () => {
    navigator.vibrate(100);
    isActive.set(true);
  });

  anchor.addEventListener("pointerenter", handleAnchorPointerEnter);
  anchor.addEventListener("pointerleave", handleAnchorPointerLeave);
  window.addEventListener("blur", handleAnchorPointerLeave);

  const unsubscribe = isActive.subscribe((newValue) => {
    // todo: remove duplication
    if (newValue) {
      if (initialized) {
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
      unsubscribe();
      anchorGesture.destroy();

      anchor.removeEventListener("pointerenter", handleAnchorPointerEnter);
      anchor.removeEventListener("pointerleave", handleAnchorPointerLeave);
      window.removeEventListener("blur", handleAnchorPointerLeave);
    },
    update(options: FloatingUiOptions<Props>) {
      currentOptions = options;

      if (currentOptions.when && get(isActive)) {
        if (initialized) {
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
