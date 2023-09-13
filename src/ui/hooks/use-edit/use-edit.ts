import type { Moment } from "moment";
import type { Readable } from "svelte/store";
import { derived, get, writable } from "svelte/store";

import type { settings } from "../../../global-stores/settings";
import type { PlacedPlanItem, PlanItem } from "../../../types";
import { getMinutesSinceMidnight } from "../../../util/moment";

import { transform } from "./transform/transform";
import type { Edit } from "./types";
import { EditMode } from "./types";

interface UseEditProps {
  parsedTasks: PlacedPlanItem[];
  pointerOffsetY: Readable<number>;
  settings: typeof settings;
}

interface CreateTaskProps {
  start: Moment;
  durationMinutes: number;
}

function createTask({ start, durationMinutes }: CreateTaskProps) {
  return {
    start,
    durationMinutes,
    get startMinutes() {
      return getMinutesSinceMidnight(start);
    },
    get endMinutes() {
      return this.startMinutes + durationMinutes;
    },
  };
}

// todo: this is duplicated, but this version is more efficient
export function offsetYToMinutes_NEW(
  offsetY: number,
  zoomLevel: number,
  hiddenHoursSize: number,
) {
  return (offsetY + hiddenHoursSize) / zoomLevel;
}

export function useEdit({
  parsedTasks,
  pointerOffsetY,
  settings,
}: UseEditProps) {
  const baselineTasks = writable(parsedTasks);
  const editInProgress = writable<Edit | undefined>();

  const displayedTasks = derived(
    [editInProgress, pointerOffsetY, baselineTasks, settings],
    ([$editInProgress, $pointerOffsetY, $baselineTasks, $settings]) => {
      if (!$editInProgress) {
        return $baselineTasks;
      }

      const cursorMinutes = offsetYToMinutes_NEW(
        $pointerOffsetY,
        $settings.zoomLevel,
        $settings.startHour,
      );

      return transform($baselineTasks, cursorMinutes, $editInProgress);
    },
  );

  function startEdit(planItem: PlanItem, mode: EditMode) {
    editInProgress.set({ mode, taskId: planItem.id });
  }

  async function confirmEdit() {
    // todo: this is hard to understand and error-prone (depends on order)
    baselineTasks.set(get(displayedTasks));
    editInProgress.set(undefined);

    // todo: sync with file system
  }

  function cancelEdit() {
    editInProgress.set(undefined);
  }

  return {
    startEdit,
    confirmEdit,
    cancelEdit,
    displayedTasks,
  };
}
