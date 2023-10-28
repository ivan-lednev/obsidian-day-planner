import { Moment } from "moment/moment";
import { DataArray, STask } from "obsidian-dataview";
import { derived, get, Readable } from "svelte/store";

import { addHorizontalPlacing } from "../../overlap/overlap";
import { ObsidianFacade } from "../../service/obsidian-facade";
import { DayPlannerSettings } from "../../settings";
import { OnUpdateFn, PlacedTask, UnscheduledTask } from "../../types";
import { getTasksForDay } from "../../util/get-tasks-for-day";
import { copy, offsetYToMinutes } from "../../util/task-utils";

import { createTask } from "./use-edit/transform/create";
import { EditMode } from "./use-edit/types";
import { useEdit } from "./use-edit/use-edit";

export interface UseTasksProps {
  day: Moment;
  dataviewTasks: DataArray<STask>;
  settings: DayPlannerSettings;
  pointerOffsetY: Readable<number>;
  fileSyncInProgress: Readable<boolean>;
  onUpdate: OnUpdateFn;
  obsidianFacade: ObsidianFacade;
}

export function useTasks({
  day,
  dataviewTasks,
  settings,
  pointerOffsetY,
  fileSyncInProgress,
  onUpdate,
  obsidianFacade,
}: UseTasksProps) {
  const { withTime, noTime } = getTasksForDay(day, dataviewTasks, settings);
  const tasks = { withTime: addHorizontalPlacing(withTime), noTime };

  const cursorMinutes = derived([pointerOffsetY], ([$pointerOffsetY]) =>
    offsetYToMinutes($pointerOffsetY, settings.zoomLevel, settings.startHour),
  );

  const { startEdit, cancelEdit, confirmEdit, editStatus, displayedTasks } =
    useEdit({
      tasks,
      settings,
      pointerOffsetY,
      fileSyncInProgress,
      onUpdate,
    });

  async function handleMouseDown() {
    const newTask = await createTask(day, get(cursorMinutes));

    startEdit({ task: { ...newTask, isGhost: true }, mode: EditMode.CREATE });
  }

  function handleResizeStart(event: MouseEvent, task: PlacedTask) {
    const mode = event.ctrlKey
      ? EditMode.RESIZE_AND_SHIFT_OTHERS
      : EditMode.RESIZE;

    startEdit({ task, mode });
  }

  async function handleTaskMouseUp(task: UnscheduledTask) {
    if (get(editStatus)) {
      return;
    }

    const { path, line } = task.location;
    await obsidianFacade.revealLineInFile(path, line);
  }

  function handleGripMouseDown(event: MouseEvent, task: PlacedTask) {
    if (event.ctrlKey) {
      startEdit({ task, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    } else if (event.shiftKey) {
      startEdit({ task: copy(task), mode: EditMode.CREATE });
    } else {
      startEdit({ task, mode: EditMode.DRAG });
    }
  }

  function startScheduling(task: UnscheduledTask) {
    const withAddedTime = {
      ...task,
      startMinutes: get(cursorMinutes),
      // todo: remove this. It's added just for type compatibility
      startTime: window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.SCHEDULE });
  }

  return {
    cancelEdit,
    confirmEdit,
    editStatus,
    displayedTasks,
    handleMouseDown,
    handleResizeStart,
    handleTaskMouseUp,
    handleGripMouseDown,
    startScheduling,
  };
}
