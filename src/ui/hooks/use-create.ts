import type { Moment } from "moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { Writable, writable } from "svelte/store";

import { DEFAULT_DURATION_MINUTES } from "../../constants";
import { appendToPlan } from "../../plan";
import {
  getTimeFromYOffset,
  roundToSnapStep,
} from "../../store/timeline-store";
import type { PlanItem } from "../../types";
import { minutesToMomentOfDay } from "../../util/moment";

export function useCreate() {
  const creating = writable(false);

  function startCreation() {
    creating.set(true);
  }

  async function confirmCreation(
    tasks: Writable<PlanItem[]>,
    day: Moment,
    pointerYOffset: number,
  ) {
    creating.set(false);

    // TODO: day goes here
    const newPlanItem = createPlanItemFromTimeline(day, pointerYOffset);

    // todo: clean up item creation
    // @ts-ignore
    tasks.update((previous) => [...previous, newPlanItem]);

    // @ts-ignore
    await appendToPlan(getDailyNote(day, getAllDailyNotes()).path, newPlanItem);
  }

  return {
    creating,
    startCreation,
    confirmCreation,
  };
}

function createPlanItemFromTimeline(day: Moment, pointerYOffset: number) {
  const startMinutes = getTimeFromYOffset(roundToSnapStep(pointerYOffset));
  const endMinutes = startMinutes + DEFAULT_DURATION_MINUTES;

  return {
    id: String(Math.random()),
    startMinutes,
    durationMinutes: DEFAULT_DURATION_MINUTES,
    endMinutes,
    text: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    endTime: minutesToMomentOfDay(endMinutes, day),
    // todo: no hardcode
    listTokens: "- ",
    location: {
      path: getDailyNote(day, getAllDailyNotes()).path,
    },
  };
}
