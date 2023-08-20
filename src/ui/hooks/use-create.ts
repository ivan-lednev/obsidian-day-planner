import { appendToPlan } from "../../plan";
import {
  getMomentOfActiveDay,
  getTimeFromYOffset,
  getTimelineFile,
  roundToSnapStep,
  tasks,
} from "../../store/timeline-store";
import { get, writable } from "svelte/store";
import { DEFAULT_DURATION_MINUTES } from "../../constants";
import { minutesToMomentOfDay } from "../../util/moment";
import { getDailyNoteForToday } from "../../util/daily-notes";

export function useCreate() {
  const creating = writable(false);

  function startCreation() {
    creating.set(true);
  }

  function cancelCreation() {
    creating.set(false);
  }

  async function confirmCreation(pointerYOffset: number) {
    // todo: out of place
    if (!get(creating)) {
      return;
    }

    creating.set(false);

    const newPlanItem = createPlanItemFromTimeline(pointerYOffset);

    // @ts-ignore
    tasks.update((previous) => [...previous, newPlanItem]);

    // @ts-ignore
    await appendToPlan(getTimelineFile().path, newPlanItem);
  }

  return {
    creating,
    startCreation,
    cancelCreation,
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
