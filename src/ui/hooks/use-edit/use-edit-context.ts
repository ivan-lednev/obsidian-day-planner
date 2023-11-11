import { Moment } from "moment";
import { derived, get, Readable, writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import { DayPlannerSettings } from "../../../settings";
import { OnUpdateFn, Tasks, TasksForDay } from "../../../types";
import { findUpdated, offsetYToMinutes } from "../../../util/task-utils";

import { getDayKey } from "./transform/drag-and-shift-others";
import { EditOperation } from "./types";
import { useDisplayedTasks } from "./use-displayed-tasks";
import { useEditHandlers } from "./use-edit-handlers";

export interface UseEditContextProps {
  fileSyncInProgress: Readable<boolean>;
  obsidianFacade: ObsidianFacade;
  onUpdate: OnUpdateFn;
  settings: DayPlannerSettings;
  visibleTasks: Record<string, TasksForDay>;
}

function useCursorMinutes(
  pointerOffsetY: Readable<number>,
  settings: DayPlannerSettings,
) {
  return derived(pointerOffsetY, ($pointerOffsetY) =>
    offsetYToMinutes($pointerOffsetY, settings.zoomLevel, settings.startHour),
  );
}

export function useEditContext({
  obsidianFacade,
  onUpdate,
  settings,
  visibleTasks,
}: UseEditContextProps) {
  const editOperation = writable<EditOperation | undefined>();
  const pointerOffsetY = writable(0);
  const hoveredDay = writable<Moment>();
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  function startEdit(operation: EditOperation) {
    editOperation.set(operation);
  }

  function cancelEdit() {
    editOperation.set(undefined);
  }

  async function confirmEdit() {
    if (get(editOperation) === undefined) {
      return;
    }

    const currentTasks = get(displayedTasks);

    // todo: order matters! Make it more explicit
    editOperation.set(undefined);

    function getAllWithTime(tasks: Tasks) {
      return Object.values(tasks).flatMap(({ withTime }) => withTime);
    }

    const dirty = findUpdated(
      getAllWithTime(get(baselineTasks)),
      getAllWithTime(currentTasks),
    );

    if (dirty.length === 0) {
      return;
    }

    baselineTasks.set(currentTasks);
    await onUpdate(dirty);
  }

  const cursorPos = derived(
    [hoveredDay, cursorMinutes],
    ([$hoveredDay, $cursorMinutes]) => {
      return {
        minutes: $cursorMinutes,
        day: $hoveredDay,
      };
    },
  );

  const baselineTasks = writable(visibleTasks);
  const displayedTasks = useDisplayedTasks({
    baselineTasks,
    editOperation,
    cursorPos,
  });

  function getEditHandlers(day: Moment) {
    const dayKey = getDayKey(day);

    const handlers = useEditHandlers({
      day,
      obsidianFacade,
      startEdit,
      cursorMinutes,
      editOperation,
    });

    function handleMouseEnter() {
      hoveredDay.set(day);
    }

    return {
      ...handlers,
      handleMouseEnter,
      cancelEdit,
      pointerOffsetY,
      displayedTasks: derived(displayedTasks, ($displayedTasks) => {
        return $displayedTasks[dayKey] || { withTime: [], noTime: [] };
      }),
    };
  }

  return {
    displayedTasks,
    confirmEdit,
    getEditHandlers,
  };
}
