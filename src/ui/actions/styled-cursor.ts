export function styledCursor(el: HTMLElement, cursor: string) {
  const initial = el.style.cursor;
  el.style.cursor = cursor;

  return {
    update(newCursor?: string) {
      el.style.cursor = newCursor || initial;
    },
    destroy() {
      el.style.cursor = initial;
    },
  };
}
