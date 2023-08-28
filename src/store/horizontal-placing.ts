import { derived, get } from "svelte/store";

import { computeOverlap } from "../parser/overlap";
import type { Overlap } from "../types";

import { planItemsByDateUid } from "./tasks";

// todo: delete
export const overlapLookup = derived(planItemsByDateUid, ($taskLookup) => {
  return computeOverlap(Object.values($taskLookup).map(get).flat());
});

export function getHorizontalPlacing(overlap: Overlap) {
  const widthPercent = overlap ? (overlap.span / overlap.columns) * 100 : 100;
  const xOffsetPercent = overlap ? (100 / overlap.columns) * overlap.start : 0;

  return {
    widthPercent,
    xOffsetPercent,
  };
}
