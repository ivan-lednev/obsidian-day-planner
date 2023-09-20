import { defaultDurationMinutes } from "../constants";
import { getDiffInMinutes } from "../util/moment";

import type { createPlanItem } from "./parser";

export function calculateDefaultDuration(
  item: ReturnType<typeof createPlanItem>, // todo: this should be a new type
  next?: ReturnType<typeof createPlanItem>,
) {
  if (item.endTime) {
    return getDiffInMinutes(item.startTime, item.endTime);
  }

  if (next) {
    const minutesUntilNext = getDiffInMinutes(next.startTime, item.startTime);

    if (minutesUntilNext < defaultDurationMinutes) {
      return minutesUntilNext;
    }
  }

  return defaultDurationMinutes;
}
