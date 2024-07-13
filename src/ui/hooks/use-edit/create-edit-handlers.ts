import { Moment } from "moment/moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import { get, Readable, Writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import { PlacedTask, UnscheduledTask } from "../../../types";
import { createTask, getSchedueldDayFromText } from "../../../util/task-utils";

import { EditMode, EditOperation } from "./types";

export interface UseEditHandlersProps {
  startEdit: (operation: EditOperation) => void;
  // todo: make dynamic, since it can change?
  day: Moment;
  obsidianFacade: ObsidianFacade;
  cursorMinutes: Readable<number>;
  editOperation: Writable<EditOperation>;
}

export function createEditHandlers({
  day,
  obsidianFacade,
  startEdit,
  cursorMinutes,
  editOperation,
}: UseEditHandlersProps) {
  function handleContainerMouseDown() {
    const newTask = createTask(day, get(cursorMinutes));

    startEdit({
      task: { ...newTask, isGhost: true },
      mode: EditMode.CREATE,
      day,
    });
  }

  function handleResizerMouseDown(task: PlacedTask, mode: EditMode) {
    startEdit({ task, mode, day });
  }

  async function handleTaskMouseUp(task: UnscheduledTask) {
    if (get(editOperation)) {
      return;
    }

    const { path, line } = task.location;
    await obsidianFacade.revealLineInFile(path, line);
  }

  function handleGripMouseDown(task: PlacedTask, mode: EditMode) {
    startEdit({ task, mode, day });
  }

  function handleUnscheduledTaskGripMouseDown(task: UnscheduledTask) {
    const withAddedTime = {
      ...task,
      startMinutes: get(cursorMinutes),
      startTime:
        getSchedueldDayFromText(task) ||
        getDateFromPath(task.location.path, "day"),
    };

    if (!withAddedTime.startTime) {
      throw new Error(
        "Could not get the day of the task. It should be provided through the Tasks Plugins schduled feature, or the path of the daily note. If you did provide the day through one of these options, please report the issue at https://github.com/ivan-lednev/obsidian-day-planner/issues",
      );
    }

    startEdit({ task: withAddedTime, mode: EditMode.DRAG, day });
  }

  function handleMouseEnter() {
    editOperation.update(
      (previous) =>
        previous && {
          ...previous,
          day,
        },
    );
  }

  return {
    handleMouseEnter,
    handleGripMouseDown,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  };
}
