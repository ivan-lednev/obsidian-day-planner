import { isNotVoid } from "typed-assert";

import { floatingUiOffset } from "../constants";

export function createOffsetFnWithFrozenCrossAxis() {
  let initialFloatingRectWidth: number | undefined;

  return ({ rects: { reference, floating } }) => {
    if (initialFloatingRectWidth === undefined) {
      initialFloatingRectWidth = floating.width;
    }

    isNotVoid(initialFloatingRectWidth);

    return {
      mainAxis: floatingUiOffset,
      crossAxis: reference.width / 2 - initialFloatingRectWidth / 2,
    };
  };
}
