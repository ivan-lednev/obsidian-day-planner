import type { Moment } from "moment";

import { defaultDurationMinutes } from "../../../../constants";
import type { PlacedPlanItem } from "../../../../types";
import { createDailyNoteIfNeeded } from "../../../../util/daily-notes";
import { getId } from "../../../../util/id";
import { minutesToMomentOfDay } from "../../../../util/moment";

export function create(
  baseline: PlacedPlanItem[],
  editTarget: PlacedPlanItem,
  cursorTime: number,
): PlacedPlanItem[] {
  const startMinutes = cursorTime;
  const endMinutes = cursorTime + editTarget.durationMinutes;

  const updated = {
    ...editTarget,
    startMinutes,
    endMinutes,
  };

  return [...baseline, updated];
}

// todo: this belongs to task utils
export async function createPlanItem(
  day: Moment,
  startMinutes: number,
): Promise<PlacedPlanItem> {
  const endMinutes = startMinutes + defaultDurationMinutes;

  const { path } = await createDailyNoteIfNeeded(day);

  return {
    id: getId(),
    startMinutes,
    durationMinutes: defaultDurationMinutes,
    endMinutes,
    firstLineText: "New item",
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    endTime: minutesToMomentOfDay(endMinutes, day),
    // todo: no hardcode, this should be configurable
    listTokens: "- ",
    // todo: fix this, do not check for newly created tasks using their location
    // @ts-ignore
    location: {
      path,
    },
    placing: {
      widthPercent: 100,
      xOffsetPercent: 0,
    },
  };
}
