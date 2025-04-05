import { sanitizeHTMLToDom } from "obsidian";

export function isTouchEvent(event: PointerEvent) {
  return ["pen", "touch"].includes(event.pointerType);
}

export function getIsomorphicClientY(
  event: PointerEvent | MouseEvent | TouchEvent,
) {
  if (event instanceof PointerEvent || event instanceof MouseEvent) {
    return event.clientY;
  }

  const firstTouch = event.touches[0];

  return firstTouch.pageY;
}

export function isEventRelated(
  event: PointerEvent,
  otherNode: HTMLElement | null,
) {
  if (!otherNode) {
    return false;
  }

  return (
    event.relatedTarget &&
    (event.relatedTarget === otherNode ||
      (event.relatedTarget instanceof Node &&
        otherNode.contains(event.relatedTarget)))
  );
}

export function isEventOutside(
  event: PointerEvent,
  container: HTMLElement | null,
) {
  if (!container) {
    return false;
  }

  return (
    event.target !== container &&
    event.target instanceof Node &&
    !container.contains(event.target)
  );
}

export function mountSanitized(el: HTMLElement, html: string) {
  if (!html) {
    return;
  }

  el.empty();

  const fragment = sanitizeHTMLToDom(html);

  el.appendChild(fragment);
}
