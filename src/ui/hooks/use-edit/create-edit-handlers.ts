import type { Readable, Writable } from "svelte/store";
import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";

import type { PeriodicNotes } from "../../../service/periodic-notes";
import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type {
  EditableTimeBlock,
  WithDuration,
} from "../../../time-block-types";
import type { PointerDateTime } from "../../../types";
import { getMinutesSinceMidnight } from "../../../util/moment";
import * as t from "../../../util/time-block-utils";

import type { EditOperation } from "./types";
import { EditMode } from "./types";

export interface UseEditHandlersProps {
  startEdit: (operation: EditOperation) => void;
  workspaceFacade: WorkspaceFacade;
  editOperation: Writable<EditOperation | undefined>;
  settings: Readable<DayPlannerSettings>;
  pointerDateTime: Readable<PointerDateTime>;
  periodicNotes: PeriodicNotes;
}

export function createEditHandlers({
  workspaceFacade,
  periodicNotes,
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
      task: newTask,
      mode: EditMode.CREATE,
    });
  }

  function handleResizerMouseDown(
    task: WithDuration<EditableTimeBlock>,
    mode: EditMode,
  ) {
    const pointerDay = get(pointerDateTime).dateTime;

    isNotVoid(pointerDay, "Day cannot be undefined on edit");

    startEdit({ task, mode });
  }

  async function handleTaskMouseUp(task: EditableTimeBlock) {
    if (get(editOperation) || !task.location) {
      return;
    }

    const { path, position } = task.location;
    await workspaceFacade.revealLineInFile(path, position?.start?.line);
  }

  // todo: fix (should probably use "day")
  function handleUnscheduledTaskGripMouseDown(task: EditableTimeBlock) {
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
        ? periodicNotes.getDateFromPath(task.location.path, "day") ||
          window.moment()
        : window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.DRAG });
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
