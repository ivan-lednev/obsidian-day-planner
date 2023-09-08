import type { Moment } from "moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { Writable, writable } from "svelte/store";

import { DEFAULT_DURATION_MINUTES } from "../../constants";
import {
  getTimeFromYOffset,
  roundToSnapStep,
} from "../../global-stores/settings-utils";
import type { PlanItem } from "../../types";
import { createDailyNoteIfNeeded } from "../../util/daily-notes";
import { minutesToMomentOfDay } from "../../util/moment";
import { addPlacing } from "../../util/obsidian";
import { appendToPlan } from "../../util/plan";

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

    const newPlanItem = await createPlanItemFromTimeline(day, pointerYOffset);
    const filePath = getDailyNote(day, getAllDailyNotes()).path;

    // todo: clean up item creation
    // @ts-ignore
    await appendToPlan(filePath, newPlanItem);

    // @ts-ignore
    // todo: overlap logic should be hidden
    tasks.update((previous) => addPlacing([...previous, newPlanItem]));
  }

  return {
    creating,
    startCreation,
    confirmCreation,
  };
}

async function createPlanItemFromTimeline(day: Moment, pointerYOffset: number) {
  const startMinutes = getTimeFromYOffset(roundToSnapStep(pointerYOffset));
  const endMinutes = startMinutes + DEFAULT_DURATION_MINUTES;

  const { path } = await createDailyNoteIfNeeded(day);

  return {
    id: String(Math.random()),
    startMinutes,
    durationMinutes: DEFAULT_DURATION_MINUTES,
    endMinutes,
    firstLineText: "New item",
    startTime: minutesToMomentOfDay(startMinutes, day),
    endTime: minutesToMomentOfDay(endMinutes, day),
    // todo: no hardcode
    listTokens: "- ",
    location: {
      path,
    },
  };
}
