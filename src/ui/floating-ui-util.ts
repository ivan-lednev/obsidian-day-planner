import { floatingUiOffset } from "../constants";

export function createOffsetFnWithFrozenCrossAxis() {
  let initialCrossAxisOffset: number | undefined;

  return ({ rects: { reference, floating } }) => {
    if (initialCrossAxisOffset === undefined) {
      initialCrossAxisOffset = reference.width / 2 - floating.width / 2;
    }

    return {
      mainAxis: floatingUiOffset,
      crossAxis: initialCrossAxisOffset,
    };
  };
}
