import { Moment } from "moment/moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import { get, Readable, Writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import { DayPlannerSettings } from "../../../settings";
import { Task, UnscheduledTask } from "../../../types";
import { createTask } from "../../../util/task-utils";

import { EditMode, EditOperation } from "./types";

export interface UseEditHandlersProps {
  startEdit: (operation: EditOperation) => void;
  // todo: make dynamic, since it can change?
  day: Moment;
  obsidianFacade: ObsidianFacade;
  cursorMinutes: Readable<number>;
  editOperation: Writable<EditOperation>;
  settings: Readable<DayPlannerSettings>;
}

export function createEditHandlers({
  day,
  obsidianFacade,
  startEdit,
  cursorMinutes,
  editOperation,
  settings,
}: UseEditHandlersProps) {
  function handleContainerMouseDown() {
    const newTask = createTask(
      day,
      get(cursorMinutes),
      get(settings).taskStatusOnCreation,
    );

    startEdit({
      task: { ...newTask, isGhost: true },
      mode: EditMode.CREATE,
      day,
    });
  }

  function handleResizerMouseDown(task: Task, mode: EditMode) {
    startEdit({ task, mode, day });
  }

  async function handleTaskMouseUp(task: UnscheduledTask) {
    if (get(editOperation)) {
      return;
    }

    const { path, position } = task.location;
    await obsidianFacade.revealLineInFile(path, position?.start?.line);
  }

  // todo: remove
  function handleGripMouseDown(task: Task, mode: EditMode) {
    startEdit({ task, mode, day });
  }

  // todo: fix
  function handleUnscheduledTaskGripMouseDown(task: UnscheduledTask) {
    const withAddedTime = {
      ...task,
      startMinutes: get(cursorMinutes),
      // todo: add a proper fix
      startTime: task.location
        ? getDateFromPath(task.location.path, "day") || window.moment()
        : window.moment(),
    };

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

export type EditHandlers = ReturnType<typeof createEditHandlers>;
