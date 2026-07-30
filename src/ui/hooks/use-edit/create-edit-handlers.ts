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
  settingsStore: Readable<DayPlannerSettings>;
  pointerDateTime: Readable<PointerDateTime>;
  periodicNotes: PeriodicNotes;
}

export function createEditHandlers({
  workspaceFacade,
  periodicNotes,
  startEdit,
  editOperation,
  settingsStore,
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
    const newTimeBlock = t.create({
      day: pointerDay,
      startMinutes: pointerMinutes,
      settings: get(settingsStore),
    });

    startEdit({
      timeBlock: newTimeBlock,
      mode: EditMode.CREATE,
    });
  }

  function handleResizerMouseDown(
    timeBlock: WithDuration<EditableTimeBlock>,
    mode: EditMode,
  ) {
    const pointerDay = get(pointerDateTime).dateTime;

    isNotVoid(pointerDay, "Day cannot be undefined on edit");

    startEdit({ timeBlock, mode });
  }

  async function handleTimeBlockMouseUp(timeBlock: EditableTimeBlock) {
    if (get(editOperation) || timeBlock.source === "unwritten") {
      return;
    }

    await workspaceFacade.revealLocation(timeBlock);
  }

  // todo: fix (should probably use "day")
  function handleUnscheduledTimeBlockGripMouseDown(
    timeBlock: EditableTimeBlock,
  ) {
    if (timeBlock.source === "unwritten") {
      throw new Error(
        "Invariant violation: an unwritten time block cannot be unscheduled",
      );
    }

    let pointerDay = get(pointerDateTime).dateTime;

    if (!pointerDay) {
      console.warn("Day should not be undefined on edit");
      pointerDay = window.moment();
    }

    const withAddedTime = {
      ...timeBlock,
      startTime:
        periodicNotes.getDateFromPath(timeBlock.path, "day") || window.moment(),
    };

    startEdit({ timeBlock: withAddedTime, mode: EditMode.DRAG });
  }

  return {
    handleGripMouseDown: handleResizerMouseDown,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTimeBlockMouseUp,
    handleUnscheduledTimeBlockGripMouseDown,
  };
}

export type EditHandlers = ReturnType<typeof createEditHandlers>;
