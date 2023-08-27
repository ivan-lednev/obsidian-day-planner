import { writable } from "svelte/store";

import { DEFAULT_DURATION_MINUTES } from "../../constants";
import { appendToPlan } from "../../plan";
import {
  getMomentOfActiveDay,
  getFileShownInTimeline,
} from "../../store/active-day";
import {
  getTimeFromYOffset,
  roundToSnapStep,
  tasks,
} from "../../store/timeline-store";
import { getDailyNoteForToday } from "../../util/daily-notes";
import { minutesToMomentOfDay } from "../../util/moment";

export function useCreate() {
  const creating = writable(false);

  function startCreation() {
    creating.set(true);
  }

  async function confirmCreation(pointerYOffset: number) {
    creating.set(false);

    const newPlanItem = createPlanItemFromTimeline(pointerYOffset);

    // todo: clean up item creation
    // @ts-ignore
    tasks.update((previous) => [...previous, newPlanItem]);

    // @ts-ignore
    await appendToPlan(getFileShownInTimeline().path, newPlanItem);
  }

  return {
    creating,
    startCreation,
    confirmCreation,
  };
}

function createPlanItemFromTimeline(pointerYOffset: number) {
  const startMinutes = getTimeFromYOffset(roundToSnapStep(pointerYOffset));
  const endMinutes = startMinutes + DEFAULT_DURATION_MINUTES;

  return {
    id: String(Math.random()),
    startMinutes,
    durationMinutes: DEFAULT_DURATION_MINUTES,
    endMinutes,
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, getMomentOfActiveDay()),
    endTime: minutesToMomentOfDay(endMinutes, getMomentOfActiveDay()),
    // todo: no hardcode
    listTokens: "- ",
    location: {
      path: getDailyNoteForToday().path,
    },
  };
}
