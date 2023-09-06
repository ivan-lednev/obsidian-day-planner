import type { Moment } from "moment";
import { derived, Readable, writable } from "svelte/store";

import type { PlanItem } from "../../types";
import { getRelationToNow } from "../../util/moment";

import type { ReactiveSettingsWithUtils } from "./cool-store";

interface CreateTaskProps {
  settings: ReactiveSettingsWithUtils;
  currentTime: Readable<Moment>;
}

export function createTask(
  planItem: PlanItem,
  { settings, currentTime }: CreateTaskProps,
) {
  const task = writable(planItem);

  // todo: add real one
  const dragging = writable(false);
  const resizing = writable(false);

  const initialOffset = derived(
    // todo: not sure if this is the cleanest way
    [task, settings.settings, settings.hiddenHoursSize],
    ([$task, $settings, $hiddenHoursSize]) => {
      return $task.startMinutes * $settings.zoomLevel - $hiddenHoursSize;
    },
  );

  const offset = derived(
    [dragging, initialOffset],
    ([$dragging, $initialOffset]) => {
      // todo: add real impl
      return $dragging ? 0 : $initialOffset;
    },
  );

  // keep the scope to a minimum for now
  // // todo: startMins, endMins, duration - these are all derived
  //
  // const startMinutes = derived(task, ($task) => {
  //   return getMinutesSinceMidnight($task.startTime)
  // });
  //
  // const endMinutes = derived(task, ($task) => {
  //   return $task.endMinutes - $task.startMinutes;
  // });
  //
  // const durationMinutes = derived(task, ($task) => {
  //   return $task.endMinutes - $task.startMinutes;
  // });

  const initialHeight = derived(
    [settings.settings, task],
    ([$settings, $task]) => {
      return $task.durationMinutes * $settings.zoomLevel;
    },
  );

  const height = derived(
    [resizing, initialHeight],
    ([$resizing, $initialHeight]) => {
      // todo: add real impl
      return $resizing ? 200 : $initialHeight;
    },
  );

  const relationToNow = derived(
    [task, currentTime],
    ([$task, $currentTime]) => {
      return getRelationToNow($currentTime, $task.startTime, $task.endTime);
    },
  );

  return {
    offset,
    height,
    relationToNow,
  };
}
