import TinyGesture from "tinygesture";

export function tappable(el: HTMLElement) {
  const gesture = new TinyGesture(el);

  let pressed = false;

  gesture.on("tap", () => {
    if (pressed) {
      return;
    }

    el.dispatchEvent(new CustomEvent("tap"));
  });

  gesture.on("longpress", () => {
    pressed = true;

    el.dispatchEvent(new CustomEvent("longpress"));
  });

  gesture.on("panend", () => {
    if (pressed) {
      setTimeout(() => {
        pressed = false;
      }, 0);
    }
  });

  return {
    destroy() {
      gesture.destroy();
    },
  };
}
