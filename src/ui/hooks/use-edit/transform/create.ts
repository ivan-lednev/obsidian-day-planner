import type { Moment } from "moment";

import { defaultDurationMinutes } from "../../../../constants";
import type { PlacedTask } from "../../../../types";
import { createDailyNoteIfNeeded } from "../../../../util/daily-notes";
import { getId } from "../../../../util/id";
import { minutesToMomentOfDay } from "../../../../util/moment";

export function create(
  baseline: PlacedTask[],
  editTarget: PlacedTask,
  cursorTime: number,
): PlacedTask[] {
  const startMinutes = cursorTime;

  const updated = {
    ...editTarget,
    startMinutes,
  };

  return [...baseline, updated];
}

// todo: this belongs to task utils
export async function createTask(
  day: Moment,
  startMinutes: number,
): Promise<PlacedTask> {
  const endMinutes = startMinutes + defaultDurationMinutes;

  const { path } = await createDailyNoteIfNeeded(day);

  return {
    id: getId(),
    startMinutes,
    durationMinutes: defaultDurationMinutes,
    firstLineText: "New item",
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    endTime: minutesToMomentOfDay(endMinutes, day),
    listTokens: "- [ ] ",
    // todo: fix this, do not check for newly created tasks using their location
    // @ts-expect-error
    location: {
      path,
    },
    placing: {
      widthPercent: 100,
      xOffsetPercent: 0,
    },
  };
}
