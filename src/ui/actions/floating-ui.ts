import {
  autoUpdate,
  computePosition,
  ComputePositionConfig,
} from "@floating-ui/dom";
import type { SvelteComponentTyped } from "svelte";
import { get, writable } from "svelte/store";

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

export function floatingUi<Props>(
  anchor: HTMLElement,
  options: FloatingUiOptions<Props>,
) {
  let floatingUiWrapper: HTMLDivElement;
  let componentInstance: SvelteComponentTyped<Props>;
  let cleanUpAutoUpdate: () => void;
  let initialized = false;

  const hoveringOverUi = writable(false);

  function init(props: Props) {
    if (initialized || !options.when) {
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
    });

    componentInstance = new options.Component({
      target: floatingUiWrapper,
      props,
    });

    cleanUpAutoUpdate = autoUpdate(anchor, floatingUiWrapper, () => {
      computePosition(anchor, floatingUiWrapper, options.options).then(
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

    initialized = false;

    componentInstance.$destroy();
    cleanUpAutoUpdate();

    floatingUiWrapper.removeEventListener(
      "mouseenter",
      handleFloatingUiMouseEnter,
    );
    floatingUiWrapper.removeEventListener(
      "mouseleave",
      handleFloatingUiMouseLeave,
    );

    document.body.removeChild(floatingUiWrapper);
  }

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
    init(options.props);
  }

  function handleAnchorMouseLeave(event: MouseEvent) {
    if (floatingUiWrapper && !isEventRelated(event, floatingUiWrapper)) {
      hoveringOverUi.set(false);
    }
  }

  anchor.addEventListener("mouseenter", handleAnchorMouseEnter);
  anchor.addEventListener("mouseleave", handleAnchorMouseLeave);
  window.addEventListener("blur", handleAnchorMouseLeave);

  const unsubscribe = hoveringOverUi.subscribe((value) => {
    if (!value) {
      onDestroy();
    }
  });

  return {
    destroy() {
      onDestroy();
      unsubscribe();

      anchor.removeEventListener("mouseenter", handleAnchorMouseEnter);
      anchor.removeEventListener("mouseleave", handleAnchorMouseLeave);
      window.removeEventListener("blur", handleAnchorMouseLeave);
    },
    update(options: FloatingUiOptions<Props>) {
      const { props, when } = options;

      if (when && get(hoveringOverUi)) {
        componentInstance?.$set(props);
      } else {
        onDestroy();
      }
    },
  };
}
