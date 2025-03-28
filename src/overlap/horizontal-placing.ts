import type { Overlap } from "../types";

export function getHorizontalPlacing(overlap?: Overlap) {
  const widthPercent = overlap ? (overlap.span / overlap.columns) * 100 : 100;
  const xOffsetPercent = overlap ? (100 / overlap.columns) * overlap.start : 0;

  return {
    widthPercent,
    xOffsetPercent,
  };
}

export type HorizontalPlacing = ReturnType<typeof getHorizontalPlacing>;
