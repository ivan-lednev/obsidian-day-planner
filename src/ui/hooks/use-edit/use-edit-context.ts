import type { Moment } from "moment";
import { derived, get, type Readable } from "svelte/store";

import type { DayPlannerSettings } from "../../../settings";
import type {
  EditableTimeBlock,
  LogTimeBlock,
  RemoteTimeBlock,
  TimelineTimeBlock,
  WithDuration,
} from "../../../time-block-types";
import {
  getAllDayTimeBlocksInRange,
  getVisibleTimeBlocks,
  layOutDayColumn,
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
import { EditMode } from "./types";

export function useEditContext(props: {
  onUpdate: OnUpdateFn;
  onLogUpdate: OnUpdateFn<LogTimeBlock>;
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

  const planLane = createLane<EditableTimeBlock>({
    source: localFilteredTimeBlocks,
    write: onUpdate,
    settingsStore,
    pointerDateTime,
    abortEditTrigger,
    onEditAborted,
  });

  const logLane = createLane<LogTimeBlock>({
    source: logTimeBlocks,
    write: onLogUpdate,
    settingsStore,
    pointerDateTime,
    abortEditTrigger,
    onEditAborted,
  });

  const plan = {
    ...planLane,

    startCreate() {
      planLane.startEdit({
        timeBlock: t.create({
          startTime: get(pointerDateTime).dateTime,
          settings: get(settingsStore),
        }),
        mode: EditMode.CREATE,
      });
    },

    startCopy(timeBlock: WithDuration<EditableTimeBlock>) {
      planLane.startEdit({
        timeBlock: t.copy(
          planLane.getUnderlyingTimeBlockWithoutSplitting(timeBlock),
        ),
        mode: EditMode.DRAG,
      });
    },
  };

  async function confirmEdit() {
    await Promise.all([plan.confirmEdit(), logLane.confirmEdit()]);
  }

  function cancelEdit() {
    plan.cancelEdit();
    logLane.cancelEdit();
  }

  const editOperation = derived(
    [plan.editOperation, logLane.editOperation],
    ([$planEditOperation, $logEditOperation]) =>
      $planEditOperation ?? $logEditOperation,
  );

  const cursor = useCursor(editOperation);

  const combinedTimeBlocks = derived(
    [remoteTimeBlocks, plan.pendingUpdate],
    ([$remoteTimeBlocks, $planPendingUpdate]): TimelineTimeBlock[] => [
      ...$remoteTimeBlocks,
      ...$planPendingUpdate,
    ],
  );

  const getDisplayedAllDayTimeBlocksForMultiDayRow = derived(
    combinedTimeBlocks,
    ($combinedTimeBlocks) => (range: m.Range) =>
      getAllDayTimeBlocksInRange($combinedTimeBlocks, range),
  );

  function getDisplayedTimeBlocksForTimeline(day: Moment) {
    return derived(combinedTimeBlocks, ($combinedTimeBlocks) =>
      layOutDayColumn({ timeBlocks: $combinedTimeBlocks, day }),
    );
  }

  function getDisplayedLogTimeBlocksForTimeline(day: Moment) {
    return derived(logLane.pendingUpdate, ($logPendingUpdate) =>
      layOutDayColumn({ timeBlocks: $logPendingUpdate, day }),
    );
  }

  return {
    lanes: { plan, log: logLane },
    cursor,
    editOperation,
    confirmEdit,
    cancelEdit,
    getDisplayedTimeBlocksForTimeline,
    getDisplayedLogTimeBlocksForTimeline,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
  };
}
