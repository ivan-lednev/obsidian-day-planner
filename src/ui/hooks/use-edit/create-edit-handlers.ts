import type { Moment } from "moment/moment";
import { getDateFromPath } from "obsidian-daily-notes-interface";
import type { Readable, Writable } from "svelte/store";
import { get } from "svelte/store";

import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type { LocalTask, WithTime } from "../../../task-types";
import { getMinutesSinceMidnight } from "../../../util/moment";
import * as t from "../../../util/task-utils";

import type { EditOperation } from "./types";
import { EditMode } from "./types";

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

    // todo: move out this check
    if (!pointerDay) {
      throw new Error("Day cannot be undefined on edit");
    }

    const pointerMinutes = getMinutesSinceMidnight(pointerDay);

    // todo: use datetime
    const newTask = t.create({
      day: pointerDay,
      startMinutes: pointerMinutes,
      settings: get(settings),
    });

    startEdit({
      task: { ...newTask, isGhost: true },
      mode: EditMode.CREATE,
    });
  }

  function handleResizerMouseDown(task: WithTime<LocalTask>, mode: EditMode) {
    const pointerDay = get(pointerDateTime).dateTime;

    if (!pointerDay) {
      throw new Error("Day cannot be undefined on edit");
    }

    startEdit({ task, mode });
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
    let pointerDay = get(pointerDateTime).dateTime;

    if (!pointerDay) {
      console.warn("Day should not be undefined on edit");
      pointerDay = window.moment();
    }

    const withAddedTime = {
      ...task,
      // todo: add a proper fix
      //  in what case does a task not have a location?
      startTime: task.location
        ? getDateFromPath(task.location.path, "day") || window.moment()
        : window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.DRAG });
  }

  function handleSearchResultGripMouseDown(task: LocalTask) {
    const dateTime = get(pointerDateTime).dateTime;

    if (!dateTime) {
      throw new Error("Day cannot be undefined on edit");
    }

    const withAddedTime = {
      ...task,
      startTime: dateTime,
    };

    startEdit({ task: withAddedTime, mode: EditMode.SCHEDULE_SEARCH_RESULT });
  }

  return {
    handleGripMouseDown: handleResizerMouseDown,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
    handleSearchResultGripMouseDown,
  };
}

export type EditHandlers = ReturnType<typeof createEditHandlers>;
