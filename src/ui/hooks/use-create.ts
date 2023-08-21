import { writable } from "svelte/store";

import { DEFAULT_DURATION_MINUTES } from "../../constants";
import { appendToPlan } from "../../plan";
import { getMomentOfActiveDay, getTimelineFile } from "../../store/active-day";
import {
  getTimeFromYOffset,
  roundToSnapStep,
  tasks,
} from "../../store/timeline-store";
import { getDailyNoteForToday } from "../../util/daily-notes";
import { minutesToMomentOfDay } from "../../util/moment";

import { useEdit } from "./use-edit";

export function useCreate() {
  const creating = writable(false);
  const { startEdit, stopEdit } = useEdit(creating);

  function startCreation() {
    startEdit();
  }

  async function handleCreationConfirm(pointerYOffset: number) {
    stopEdit();

    const newPlanItem = createPlanItemFromTimeline(pointerYOffset);

    // todo: clean up item creation
    // @ts-ignore
    tasks.update((previous) => [...previous, newPlanItem]);

    // @ts-ignore
    await appendToPlan(getTimelineFile().path, newPlanItem);
  }

  return {
    creating,
    startCreation,
    handleCreationConfirm,
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
