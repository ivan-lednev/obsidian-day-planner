import { derived, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../../settings";
import type {
  EditableLogTimeBlock,
  EditableTimeBlock,
  LogTimeBlock,
  RemoteTimeBlock,
} from "../../../time-block-types";
import {
  getAllDayTimeBlocksInRange,
  getVisibleTimeBlocks,
} from "../../../timeline-layout";
import type {
  OnEditAbortedFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../../types";
import * as m from "../../../util/moment";
import * as t from "../../../util/time-block-utils";

import { useCursor } from "./cursor";
import { createLane } from "./lane";

export function useEditContext(props: {
  onUpdate: OnUpdateFn;
  onLogUpdate: OnUpdateFn<EditableLogTimeBlock>;
  settingsStore: Readable<DayPlannerSettings>;
  localTimeBlocks: Readable<EditableTimeBlock[]>;
  logTimeBlocks: Readable<LogTimeBlock[]>;
  remoteTimeBlocks: Readable<RemoteTimeBlock[]>;
  pointerDateTime: Readable<PointerDateTime>;
  abortEditTrigger: Readable<unknown>;
  onEditAborted: OnEditAbortedFn;
}) {
  const {
    onEditAborted,
    onUpdate,
    onLogUpdate,
    settingsStore,
    localTimeBlocks,
    logTimeBlocks,
    remoteTimeBlocks,
    pointerDateTime,
    abortEditTrigger,
  } = props;

  const localFilteredTimeBlocks = derived(
    [localTimeBlocks, settingsStore],
    ([$localTimeBlocks, $settingsStore]) =>
      getVisibleTimeBlocks($localTimeBlocks, $settingsStore),
  );

  const plan = createLane<EditableTimeBlock, RemoteTimeBlock>({
    timeBlocks: localFilteredTimeBlocks,
    readonlyTimeBlocks: remoteTimeBlocks,
    createBlock: t.create,
    copyBlock: t.copy,
    onUpdate,
    settingsStore,
    pointerDateTime,
    abortEditTrigger,
    onEditAborted,
  });

  // Log blocks skip `getVisibleTimeBlocks`: hiding a clock because the task it
  // belongs to is done would hide time that was actually spent.
  const log = createLane<EditableLogTimeBlock>({
    timeBlocks: logTimeBlocks,
    createBlock: t.createLog,
    copyBlock: () => {
      throw new Error("Copying clocks is not implemented yet");
    },
    onUpdate: onLogUpdate,
    settingsStore,
    pointerDateTime,
    abortEditTrigger,
    onEditAborted,
  });

  async function confirmEdit() {
    await Promise.all([plan.confirmEdit(), log.confirmEdit()]);
  }

  function cancelEdit() {
    plan.cancelEdit();
    log.cancelEdit();
  }

  const editOperation = derived(
    [plan.editOperation, log.editOperation],
    ([$planEditOperation, $logEditOperation]) =>
      $planEditOperation ?? $logEditOperation,
  );

  const cursor = useCursor(editOperation);

  const getDisplayedAllDayTimeBlocksForMultiDayRow = derived(
    plan.displayedTimeBlocks,
    ($displayedTimeBlocks) => (range: m.Range) =>
      getAllDayTimeBlocksInRange($displayedTimeBlocks, range),
  );

  return {
    lanes: { plan, log },
    cursor,
    editOperation,
    confirmEdit,
    cancelEdit,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
  };
}
