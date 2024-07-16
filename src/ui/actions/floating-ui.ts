import {
  autoUpdate,
  computePosition,
  ComputePositionConfig,
} from "@floating-ui/dom";
import type { SvelteComponentTyped } from "svelte";
import { get, writable } from "svelte/store";
import TinyGesture from "tinygesture";

interface FloatingUiOptions<Props> {
  when: boolean;
  Component: typeof SvelteComponentTyped<Props>;
  props: Props;
  options: Partial<ComputePositionConfig>;
}

function isEventRelated(event: MouseEvent, otherNode: HTMLElement) {
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

  const hoveringOverUi = writable(false);

  function handleFloatingUiMouseEnter() {
    hoveringOverUi.set(true);
  }

  function handleFloatingUiMouseLeave(event: MouseEvent) {
    if (anchor && !isEventRelated(event, anchor)) {
      hoveringOverUi.set(false);
    }
  }

  function handleAnchorMouseEnter() {
    hoveringOverUi.set(true);
    initFloatingUi();
  }

  function handleAnchorMouseLeave(event: MouseEvent) {
    if (floatingUiWrapper && !isEventRelated(event, floatingUiWrapper)) {
      hoveringOverUi.set(false);
    }
  }

  function initFloatingUi() {
    if (initialized || !currentOptions.when) {
      return;
    }

    initialized = true;

    floatingUiWrapper = document.createElement("div");

    floatingUiWrapper.addEventListener(
      "mouseenter",
      handleFloatingUiMouseEnter,
    );
    floatingUiWrapper.addEventListener(
      "mouseleave",
      handleFloatingUiMouseLeave,
    );

    document.body.appendChild(floatingUiWrapper);
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

  function onDestroy() {
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
        "mouseenter",
        handleFloatingUiMouseEnter,
      );
      floatingUiWrapper.removeEventListener(
        "mouseleave",
        handleFloatingUiMouseLeave,
      );

      componentInstance.$destroy();
      document.body.removeChild(floatingUiWrapper);
    });
  }

  const gesture = new TinyGesture(anchor);

  gesture.on("longpress", () => {
    navigator.vibrate(100);
    hoveringOverUi.set(true);
  });

  anchor.addEventListener("mouseenter", handleAnchorMouseEnter);
  anchor.addEventListener("mouseleave", handleAnchorMouseLeave);
  window.addEventListener("blur", handleAnchorMouseLeave);

  const unsubscribe = hoveringOverUi.subscribe((isHovering) => {
    if (isHovering) {
      if (initialized) {
        cancelFadeTransition(floatingUiWrapper);
      } else {
        initFloatingUi();
      }
    } else {
      onDestroy();
    }
  });

  return {
    destroy() {
      onDestroy();
      unsubscribe();
      gesture.destroy();

      anchor.removeEventListener("mouseenter", handleAnchorMouseEnter);
      anchor.removeEventListener("mouseleave", handleAnchorMouseLeave);
      window.removeEventListener("blur", handleAnchorMouseLeave);
    },
    update(options: FloatingUiOptions<Props>) {
      currentOptions = options;

      if (currentOptions.when && get(hoveringOverUi)) {
        if (initialized) {
          componentInstance?.$set(currentOptions.props);
        } else {
          initFloatingUi();
        }
      } else {
        onDestroy();
      }
    },
  };
}
