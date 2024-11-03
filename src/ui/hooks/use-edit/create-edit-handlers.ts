import type { Moment } from "moment/moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import type { Readable, Writable } from "svelte/store";
import { get } from "svelte/store";

import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type { LocalTask, WithTime } from "../../../task-types";
import { createTask } from "../../../util/task-utils";

import type { EditOperation } from "./types";
import { EditMode } from "./types";

export interface UseEditHandlersProps {
  startEdit: (operation: EditOperation) => void;
  // todo: make dynamic, since it can change?
  day: Moment;
  workspaceFacade: WorkspaceFacade;
  cursorMinutes: Readable<number>;
  editOperation: Writable<EditOperation | undefined>;
  settings: Readable<DayPlannerSettings>;
  pointerDateTime: Writable<{ dateTime?: Moment; type?: "dateTime" | "date" }>;
}

export function createEditHandlers({
  day,
  workspaceFacade,
  startEdit,
  cursorMinutes,
  editOperation,
  settings,
  pointerDateTime,
}: UseEditHandlersProps) {
  function handleContainerMouseDown() {
    // const day = get(pointerDateTime).dateTime;
    //
    // if (!day) {
    //   throw new Error("Day cannot be undefined on edit");
    // }

    const newTask = createTask({
      day,
      startMinutes: get(cursorMinutes),
      settings: get(settings),
    });

    startEdit({
      task: { ...newTask, isGhost: true },
      mode: EditMode.CREATE,
      day,
    });
  }

  function handleResizerMouseDown(task: WithTime<LocalTask>, mode: EditMode) {
    // const day = get(pointerDateTime).dateTime;
    //
    // if (!day) {
    //   throw new Error("Day cannot be undefined on edit");
    // }

    startEdit({ task, mode, day });
  }

  async function handleTaskMouseUp(task: LocalTask) {
    if (get(editOperation) || !task.location) {
      return;
    }

    const { path, position } = task.location;
    await workspaceFacade.revealLineInFile(path, position?.start?.line);
  }

  // todo: fix (should probably use "day")
  function handleUnscheduledTaskGripMouseDown(task: LocalTask) {
    // const day = get(pointerDateTime).dateTime;
    //
    // if (!day) {
    //   throw new Error("Day cannot be undefined on edit");
    // }

    const withAddedTime = {
      ...task,
      // todo: add a proper fix
      //  in what case does a task not have a location?
      startTime: task.location
        ? getDateFromPath(task.location.path, "day") || window.moment()
        : window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.DRAG, day });
  }

  // todo: delete
  function handleMouseEnter() {
    // const day = get(pointerDateTime).dateTime;
    //
    // if (!day) {
    //   throw new Error("Day cannot be undefined on edit");
    // }

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
    handleGripMouseDown: handleResizerMouseDown,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  };
}

export type EditHandlers = ReturnType<typeof createEditHandlers>;
