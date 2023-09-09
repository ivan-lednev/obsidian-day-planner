import type { Moment } from "moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { get, Writable, writable } from "svelte/store";

import { DEFAULT_DURATION_MINUTES } from "../../constants";
import {
  getTimeFromYOffset,
  roundToSnapStep,
} from "../../global-stores/settings-utils";
import type { PlacedPlanItem } from "../../types";
import { createDailyNoteIfNeeded } from "../../util/daily-notes";
import { getHorizontalPlacing } from "../../util/horizontal-placing";
import { minutesToMomentOfDay } from "../../util/moment";
import { addPlacing } from "../../util/obsidian";
import { appendToPlan } from "../../util/plan";

const DEFAULT_NEW_TASK_DURATION = 30;

function getDefaultPlacedPlanItem() {
  // todo: no `as`
  return {
    durationMinutes: DEFAULT_NEW_TASK_DURATION,
    startMinutes: 0,
    endMinutes: DEFAULT_NEW_TASK_DURATION,
    startTime: window.moment(),
    endTime: window.moment(),
    text: "New item",
    id: "",
    placing: { ...getHorizontalPlacing() },
    isGhost: true,
  } as PlacedPlanItem;
}

export function useCreate() {
  const creating = writable(false);

  function startCreation(tasks: Writable<PlacedPlanItem[]>) {
    creating.set(true);
    tasks.update((prev) => [...prev, getDefaultPlacedPlanItem()]);
  }

  function cancelCreation(tasks: Writable<PlacedPlanItem[]>) {
    if (!get(creating)) {
      return;
    }

    creating.set(false);
    tasks.update((prev) => prev.filter((task) => !task.isGhost));
  }

  async function confirmCreation(
    tasks: Writable<PlacedPlanItem[]>,
    day: Moment,
    pointerYOffset: number,
  ) {
    creating.set(false);

    const newPlanItem = await createPlanItemFromTimeline(day, pointerYOffset);
    const filePath = getDailyNote(day, getAllDailyNotes()).path;

    // todo: overlap logic should be hidden
    // @ts-expect-error
    tasks.update((previous) => addPlacing([...previous, newPlanItem]));

    // todo: clean up item creation
    // @ts-expect-error
    await appendToPlan(filePath, newPlanItem);
  }

  return {
    creating,
    startCreation,
    confirmCreation,
    cancelCreation,
  };
}

async function createPlanItemFromTimeline(day: Moment, pointerYOffset: number) {
  // todo: duplicated snap
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
