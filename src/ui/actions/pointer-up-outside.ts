import type { Attachment } from "svelte/attachments";
import { on } from "svelte/events";

import { isEventOutside } from "../../util/dom";

export function pointerUpOutside(
  fn: (event: PointerEvent) => void,
): Attachment<HTMLElement> {
  return (el) =>
    on(document.body, "pointerup", (event) => {
      if (isEventOutside(event, el)) {
        fn(event);
      }
    });
}
