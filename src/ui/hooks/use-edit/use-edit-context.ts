import type { Moment } from "moment";
import { derived, type Readable, writable } from "svelte/store";

import type { DayPlannerSettings } from "../../../settings";
import {
  isLog,
  type EditableTimeBlock,
  type LogTimeBlock,
  type RemoteTimeBlock,
  type TimelineTimeBlock,
} from "../../../time-block-types";
import {
  getAllDayTimeBlocksInRange,
  getVisibleTimeBlocks,
  layOutDayColumn,
  layOutLogDayColumn,
} from "../../../timeline-layout";
import type {
  OnEditAbortedFn,
  OnLogUpdateFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../../types";
import * as m from "../../../util/moment";

import { useCursor } from "./cursor";
import { transform } from "./transform/transform";
import { type EditOperation } from "./types";
import { useEditActions } from "./use-edit-actions";

export function useEditContext(props: {
  onUpdate: OnUpdateFn;
  onLogUpdate: OnLogUpdateFn;
  settingsStore: Readable<DayPlannerSettings>;
  localTimeBlocks: Readable<EditableTimeBlock[]>;
  logTimeBlocks: Readable<LogTimeBlock[]>;
  remoteTimeBlocks: Readable<RemoteTimeBlock[]>;
  currentTime: Readable<Moment>;
  pointerDateTime: Readable<PointerDateTime>;
  /**
   * Fires on anything that reindexes a file. Edits are written back at line
   * positions taken from the index, so any indexing pass can invalidate an
   * edit in progress, whichever column started it.
   */
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
    currentTime,
    pointerDateTime,
    abortEditTrigger,
  } = props;

  const editOperation = writable<EditOperation | undefined>(
    undefined,
    (set, updateEditOperation) => {
      const unsubscribe = abortEditTrigger.subscribe(() => {
        updateEditOperation((currentEditOperation) => {
          if (currentEditOperation !== undefined) {
            onEditAborted();
          }

          return undefined;
        });
      });

      return unsubscribe;
    },
  );
  const cursor = useCursor(editOperation);

  const localFilteredTimeBlocks = derived(
    [localTimeBlocks, settingsStore],
    ([$localTimeBlocks, $settingsStore]) =>
      getVisibleTimeBlocks($localTimeBlocks, $settingsStore),
  );

  const baselineTimeBlocks = writable<EditableTimeBlock[]>([], (set) => {
    return localFilteredTimeBlocks.subscribe(set);
  });

  // Log blocks skip `getVisibleTimeBlocks`: hiding a clock because the task it
  // belongs to is done would hide time that was actually spent.
  const logBaselineTimeBlocks = writable<LogTimeBlock[]>([], (set) => {
    return logTimeBlocks.subscribe(set);
  });

  const timeBlocksWithPendingUpdate = derived(
    [editOperation, baselineTimeBlocks, settingsStore, pointerDateTime],
    ([
      $editOperation,
      $baselineTimeBlocks,
      $settingsStore,
      $pointerDateTime,
    ]) => {
      const timeBlock = $editOperation?.timeBlock;

      if (!$editOperation || !timeBlock || isLog(timeBlock)) {
        return $baselineTimeBlocks;
      }

      return transform(
        $baselineTimeBlocks,
        { timeBlock, mode: $editOperation.mode },
        $settingsStore,
        $pointerDateTime,
      );
    },
  );

  const logTimeBlocksWithPendingUpdate = derived(
    [editOperation, logBaselineTimeBlocks, settingsStore, pointerDateTime],
    ([
      $editOperation,
      $logBaselineTimeBlocks,
      $settingsStore,
      $pointerDateTime,
    ]) => {
      const timeBlock = $editOperation?.timeBlock;

      if (!$editOperation || !timeBlock || !isLog(timeBlock)) {
        return $logBaselineTimeBlocks;
      }

      return transform(
        $logBaselineTimeBlocks,
        { timeBlock, mode: $editOperation.mode },
        $settingsStore,
        $pointerDateTime,
      );
    },
  );

  const { startEdit, startCopy, confirmEdit, cancelEdit, startCreate } =
    useEditActions({
      editOperation,
      baselineTimeBlocks,
      logBaselineTimeBlocks,
      timeBlocksWithPendingUpdate,
      logTimeBlocksWithPendingUpdate,
      onUpdate,
      onLogUpdate,
      pointerDateTime,
      settingsStore,
    });

  const combinedTimeBlocks = derived(
    [remoteTimeBlocks, timeBlocksWithPendingUpdate],
    ([
      $remoteTimeBlocks,
      $timeBlocksWithPendingUpdate,
    ]): TimelineTimeBlock[] => [
      ...$remoteTimeBlocks,
      ...$timeBlocksWithPendingUpdate,
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
    return derived(
      [logTimeBlocksWithPendingUpdate, currentTime],
      ([$logTimeBlocksWithPendingUpdate, $currentTime]) =>
        layOutLogDayColumn({
          timeBlocks: $logTimeBlocksWithPendingUpdate,
          day,
          currentTime: $currentTime,
        }),
    );
  }

  return {
    cursor,
    startEdit,
    startCopy,
    startCreate,
    confirmEdit,
    cancelEdit,
    editOperation,
    getDisplayedTimeBlocksForTimeline,
    getDisplayedLogTimeBlocksForTimeline,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
  };
}
