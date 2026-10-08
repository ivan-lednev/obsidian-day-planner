import {
  autoUpdate,
  computePosition,
  type ComputePositionConfig,
} from "@floating-ui/dom";
import type { Attachment } from "svelte/attachments";
import { isNotVoid } from "typed-assert";

export function useFloatingUi(
  getAnchor: () => HTMLElement | undefined,
  options: Partial<ComputePositionConfig>,
): Attachment<HTMLElement> {
  return (floatingUi) => {
    const anchor = getAnchor();

    isNotVoid(
      anchor,
      "Cannot initialize floating UI before obtaining a reference to anchor.",
    );

    return autoUpdate(anchor, floatingUi, () => {
      computePosition(anchor, floatingUi, options).then(({ x, y }) => {
        Object.assign(floatingUi.style, {
          left: `${x}px`,
          top: `${y}px`,
        });
      });
    });
  };
}
