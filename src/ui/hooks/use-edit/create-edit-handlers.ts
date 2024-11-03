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
import { getMinutesSinceMidnight } from "../../../util/moment";

export interface UseEditHandlersProps {
  startEdit: (operation: EditOperation) => void;
  workspaceFacade: WorkspaceFacade;
  editOperation: Writable<EditOperation | undefined>;
  settings: Readable<DayPlannerSettings>;
  pointerDateTime: Writable<{ dateTime?: Moment; type?: "dateTime" | "date" }>;
}

export function createEditHandlers({
  workspaceFacade,
  startEdit,
  editOperation,
  settings,
  pointerDateTime,
}: UseEditHandlersProps) {
  function handleContainerMouseDown() {
    const pointerDay = get(pointerDateTime).dateTime;

    if (!pointerDay) {
      throw new Error("Day cannot be undefined on edit");
    }

    const pointerMinutes = getMinutesSinceMidnight(pointerDay);

    // todo: use datetime
    const newTask = createTask({
      day: pointerDay,
      startMinutes: pointerMinutes,
      settings: get(settings),
    });

    startEdit({
      task: { ...newTask, isGhost: true },
      mode: EditMode.CREATE,
      day: pointerDay,
    });
  }

  function handleResizerMouseDown(task: WithTime<LocalTask>, mode: EditMode) {
    const pointerDay = get(pointerDateTime).dateTime;

    if (!pointerDay) {
      throw new Error("Day cannot be undefined on edit");
    }

    startEdit({ task, mode, day: pointerDay });
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
    const pointerDay = get(pointerDateTime).dateTime;

    if (!pointerDay) {
      throw new Error("Day cannot be undefined on edit");
    }

    const withAddedTime = {
      ...task,
      // todo: add a proper fix
      //  in what case does a task not have a location?
      startTime: task.location
        ? getDateFromPath(task.location.path, "day") || window.moment()
        : window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.DRAG, day: pointerDay });
  }

  return {
    handleGripMouseDown: handleResizerMouseDown,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  };
}

export type EditHandlers = ReturnType<typeof createEditHandlers>;
