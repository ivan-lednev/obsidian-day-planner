import { on } from "svelte/events";
import { isNotVoid } from "typed-assert";

import { isOutside } from "../../util/util";

export function pointerUpOutside(fn: (event: PointerEvent) => void) {
  return (el: HTMLElement) => {
    const off = on(document.body, "pointerup", (event) => {
      if (isOutside(event, el)) {
        fn(event);
      }
    });

    return {
      destroy() {
        off();
      },
    };
  };
}

/**
 * An action factory that lets you fire some callback when the event is outside of a registered set of elements.
 */
export function createPointerUpOutsideAction(
  fn: (event: PointerEvent) => void,
) {
  const registry: Set<HTMLElement> = new Set();

  let bodyTeardownFn: (() => void) | undefined;

  function init(el: HTMLElement) {
    registry.add(el);

    if (bodyTeardownFn) {
      return;
    }

    bodyTeardownFn = on(document.body, "pointerup", (event) => {
      if (Array.from(registry).every((el) => isOutside(event, el))) {
        fn(event);
      }
    });
  }

  function teardown(el: HTMLElement) {
    registry.delete(el);

    if (registry.size === 0) {
      isNotVoid(bodyTeardownFn);
      bodyTeardownFn();
      bodyTeardownFn = undefined;
    }
  }

  return (el: HTMLElement) => {
    init(el);

    return {
      destroy(el: HTMLElement) {
        teardown(el);
      },
    };
  };
}
