import TinyGesture, { type Options } from "tinygesture";

export function createGestures(props: {
  ontap?: (event: MouseEvent | TouchEvent) => void;
  onlongpress?: (event: MouseEvent | TouchEvent) => void;
  onpanstart?: (event: MouseEvent | TouchEvent) => void;
  onpanend?: (event: MouseEvent | TouchEvent) => void;
  onpanmove?: (event: MouseEvent | TouchEvent) => void;
  options?: Partial<Options>;
}) {
  const { ontap, onlongpress, onpanstart, onpanend, onpanmove, options } =
    props;

  let pressed = false;

  return (el: HTMLElement) => {
    const gesture = new TinyGesture(el, options);

    gesture.on("tap", (event) => {
      if (pressed) {
        return;
      }

      ontap?.(event);
    });

    gesture.on("longpress", (event) => {
      pressed = true;

      onlongpress?.(event);
    });

    gesture.on("panend", (event) => {
      if (pressed) {
        setTimeout(() => {
          pressed = false;
        });
      }

      onpanend?.(event);
    });

    gesture.on("panstart", (event) => {
      onpanstart?.(event);
    });

    gesture.on("panmove", (event) => {
      onpanmove?.(event);
    });

    return {
      destroy() {
        gesture.destroy();
      },
    };
  };
}
