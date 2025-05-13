import type { Overlap } from "../types";

export function getHorizontalPlacing(overlap?: Overlap) {
  const spanPercent = overlap ? (overlap.span / overlap.columns) * 100 : 100;
  const offsetPercent = overlap ? (100 / overlap.columns) * overlap.start : 0;

  return {
    spanPercent,
    offsetPercent,
  };
}

export type HorizontalPlacing = ReturnType<typeof getHorizontalPlacing>;
