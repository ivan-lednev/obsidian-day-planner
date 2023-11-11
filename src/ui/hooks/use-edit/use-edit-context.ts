import { Moment } from "moment";
import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";
import { derived, get, Readable, writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import { DayPlannerSettings } from "../../../settings";
import { OnUpdateFn, Tasks, TasksForDay } from "../../../types";
import { findUpdated, offsetYToMinutes } from "../../../util/task-utils";

import { getDayKey } from "./transform/drag-and-shift-others";
import { EditOperation } from "./types";
import {
  useDisplayedTasks,
  useDisplayedTasks_MULTIDAY,
} from "./use-displayed-tasks";
import { useEditActions } from "./use-edit-actions";
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
  fileSyncInProgress,
  obsidianFacade,
  onUpdate,
  settings,
  visibleTasks,
}: UseEditContextProps) {
  const editOperation = writable<EditOperation | undefined>();
  const pointerOffsetY = writable(0);
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  function getEditHandlers(day: Moment) {
    // todo: return placing logic
    const tasks = visibleTasks[day.format(DEFAULT_DAILY_NOTE_FORMAT)];
    const baselineTasks = writable(tasks);

    const displayedTasks = useDisplayedTasks({
      day,
      editOperation,
      cursorMinutes,
      baselineTasks,
    });

    const { startEdit, ...actions } = useEditActions({
      editOperation,
      baselineTasks,
      displayedTasks,
      fileSyncInProgress,
      onUpdate,
    });

    // todo: define handlers outside
    const handlers = useEditHandlers({
      day,
      obsidianFacade,
      startEdit,
      cursorMinutes,
      editOperation,
    });

    return { ...handlers, ...actions, displayedTasks, pointerOffsetY };
  }

  return {
    getEditHandlers,
  };
}

export function useEditContext_MULTIDAY({
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
  const displayedTasks = useDisplayedTasks_MULTIDAY({
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
