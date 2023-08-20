import { getDiffInMinutes } from "../util/moment";
import { DEFAULT_DURATION_MINUTES } from "../constants";
import type { createPlanItem } from "./parser";

export function calculateDefaultDuration(
  item: ReturnType<typeof createPlanItem>,
  next?: ReturnType<typeof createPlanItem>,
) {
  if (item.endTime) {
    return getDiffInMinutes(item.startTime, item.endTime);
  }

  if (next) {
    const minutesUntilNext = getDiffInMinutes(next.startTime, item.startTime);

    if (minutesUntilNext < DEFAULT_DURATION_MINUTES) {
      return minutesUntilNext;
    }
  }

  return DEFAULT_DURATION_MINUTES;
}
