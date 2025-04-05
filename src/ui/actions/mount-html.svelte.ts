import { mountSanitized } from "../../util/dom";

export function mountHtmlAction(el: HTMLElement, html: string) {
  $effect(() => {
    mountSanitized(el, html);
  });
}
