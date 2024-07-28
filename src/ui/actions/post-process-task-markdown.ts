export function disableCheckBoxes(el: HTMLElement) {
  el
    .querySelectorAll(`input[type="checkbox"]`)
    ?.forEach((checkbox) => checkbox.setAttribute("disabled", "true"));
}
