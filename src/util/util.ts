export function isTouchEvent(event: PointerEvent) {
  return ["pen", "touch"].includes(event.pointerType);
}

export function isEventRelated(event: PointerEvent, otherNode?: HTMLElement) {
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

export function isTapOutside(event: PointerEvent, container: HTMLElement) {
  return (
    isTouchEvent(event) &&
    event.target !== container &&
    event.target instanceof Node &&
    !container.contains(event.target)
  );
}

export function cancelFadeTransition(el: HTMLElement) {
  Object.assign(el.style, {
    transition: "none",
    opacity: 1,
  });
}

export function addFadeTransition(el: HTMLElement) {
  Object.assign(el.style, {
    transition: "opacity 200ms",
    opacity: 0,
  });
}
