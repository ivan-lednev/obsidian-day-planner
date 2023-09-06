import type { Moment } from "moment";
import { derived, Readable, Writable, writable } from "svelte/store";

import type { PlanItem } from "../../types";
import { getRelationToNow } from "../../util/moment";

import type { ReactiveSettingsWithUtils } from "./use-drag-new";
import { useDrag } from "./use-drag-new";

interface CreateTaskProps {
  settings: ReactiveSettingsWithUtils;
  currentTime: Readable<Moment>;
  cursorOffsetY: Readable<number>;
}

export function createPositionedTasks(
  tasks: PlanItem[],
  props: CreateTaskProps,
) {
  return writable(tasks.map((t) => createPositionedTask(writable(t), props)));
}

export function createPositionedTask(
  task: Writable<PlanItem>,
  { settings, currentTime, cursorOffsetY }: CreateTaskProps,
) {
  const { dragging, ...useDragValues } = useDrag({
    settings,
    cursorOffsetY,
    task,
  });

  // todo: use real one
  const resizing = writable(false);

  const initialOffset = derived(
    // todo: not sure if this is the cleanest way
    [task, settings.settings, settings.hiddenHoursSize],
    ([$task, $settings, $hiddenHoursSize]) => {
      return $task.startMinutes * $settings.zoomLevel - $hiddenHoursSize;
    },
  );

  const offset = derived(
    [dragging, initialOffset, cursorOffsetY],
    ([$dragging, $initialOffset, $cursorOffsetY]) => {
      // todo: add real impl
      return $dragging ? $cursorOffsetY : $initialOffset;
    },
  );

  // keep the scope to a minimum for now
  // // todo: startMins, endMins, duration - these are all derived, but they should already be available in tasks, because of overlap
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
    ...useDragValues,
  };
}
