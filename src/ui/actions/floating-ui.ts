import {
  autoUpdate,
  computePosition,
  ComputePositionConfig,
} from "@floating-ui/dom";
import type { SvelteComponentTyped } from "svelte";

export type SvelteActionReturnType<P> = {
  update?: (newParams?: P) => void;
  destroy?: () => void;
} | void;

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
  let instance: SvelteComponentTyped<Props>;
  let cleanUpAutoUpdate: () => void;
  let initialized = false;

  let hoveringOverAnchor = false;
  let hoveringOverFloatingUi = false;

  function handleAnchorMouseEnter() {
    hoveringOverAnchor = true;
  }

  function handleAnchorMouseLeave() {
    hoveringOverAnchor = false;
  }

  function handleFloatingUiMouseEnter() {
    hoveringOverFloatingUi = true;
  }

  function handleFloatingUiMouseLeave() {
    hoveringOverFloatingUi = false;
  }

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

    instance = new options.Component({
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

    instance.$destroy();
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

    instance = null;
    cleanUpAutoUpdate = null;
    floatingUiWrapper = null;
  }

  anchor.addEventListener("mouseenter", handleAnchorMouseEnter);
  anchor.addEventListener("mouseleave", handleAnchorMouseLeave);
  window.addEventListener("blur", handleAnchorMouseLeave);

  init(options.props);

  return {
    destroy() {
      onDestroy();

      anchor.removeEventListener("mouseenter", handleAnchorMouseEnter);
      anchor.removeEventListener("mouseleave", handleAnchorMouseLeave);
      window.removeEventListener("blur", handleAnchorMouseLeave);
    },
    update(options: FloatingUiOptions<Props>) {
      const { props, when } = options;

      if (!when || (!hoveringOverAnchor && !hoveringOverFloatingUi)) {
        onDestroy();
        return;
      }

      instance?.$set(props);

      if (hoveringOverAnchor && !initialized) {
        init(props);
      }
    },
  };
}
