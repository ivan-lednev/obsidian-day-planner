import { derived } from "svelte/store";

import { computeOverlap } from "../parser/overlap";

import { tasks } from "./timeline-store";

const overlapLookup = derived(tasks, ($tasks) => computeOverlap($tasks));

export const getHorizontalPlacing = derived(overlapLookup, ($overlapLookup) => {
  return (id: string) => {
    const itemPlacing = $overlapLookup.get(id);

    const widthPercent = itemPlacing
      ? (itemPlacing.span / itemPlacing.columns) * 100
      : 100;

    const xOffsetPercent = itemPlacing
      ? (100 / itemPlacing.columns) * itemPlacing.start
      : 0;

    return {
      widthPercent,
      xOffsetPercent,
    };
  };
});
