import type { Moment } from "moment";
import { derived, get, type Readable, writable } from "svelte/store";

import type { DayPlannerSettings } from "../../../settings";
import type {
  EditableTimeBlock,
  LogTimeBlock,
  RemoteTimeBlock,
  TimelineTimeBlock,
} from "../../../time-block-types";
import {
  getAllDayTimeBlocksInRange,
  getVisibleTimeBlocks,
  layOutDayColumn,
  layOutLogDayColumn,
} from "../../../timeline-layout";
import type {
  OnEditAbortedFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../../types";
import * as m from "../../../util/moment";
import * as t from "../../../util/time-block-utils";

import { useCursor } from "./cursor";
import { transform } from "./transform/transform";
import { EditMode, type EditOperation } from "./types";
import { useEditActions } from "./use-edit-actions";

export function useEditContext(props: {
  onUpdate: OnUpdateFn;
  settingsStore: Readable<DayPlannerSettings>;
  localTimeBlocks: Readable<EditableTimeBlock[]>;
  logTimeBlocks: Readable<LogTimeBlock[]>;
  remoteTimeBlocks: Readable<RemoteTimeBlock[]>;
  currentTime: Readable<Moment>;
  pointerDateTime: Readable<PointerDateTime>;
  abortEditTrigger: Readable<unknown>;
  onEditAborted: OnEditAbortedFn;
}) {
  const {
    onEditAborted,
    onUpdate,
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

  const timeBlocksWithPendingUpdate = derived(
    [editOperation, baselineTimeBlocks, settingsStore, pointerDateTime],
    ([
      $editOperation,
      $baselineTimeBlocks,
      $settingsStore,
      $pointerDateTime,
    ]) => {
      return $editOperation
        ? transform(
            $baselineTimeBlocks,
            $editOperation,
            $settingsStore,
            $pointerDateTime,
          )
        : $baselineTimeBlocks;
    },
  );

  const { startEdit, startCopy, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTimeBlocks,
    timeBlocksWithPendingUpdate,
    onUpdate,
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

  // todo: log blocks are not editable yet, so they skip the transform
  function getDisplayedLogTimeBlocksForTimeline(day: Moment) {
    return derived(
      [logTimeBlocks, currentTime],
      ([$logTimeBlocks, $currentTime]) =>
        layOutLogDayColumn({
          timeBlocks: $logTimeBlocks,
          day,
          currentTime: $currentTime,
        }),
    );
  }

  function startCreate() {
    startEdit({
      timeBlock: t.create({
        startTime: get(pointerDateTime).dateTime,
        settings: get(settingsStore),
      }),
      mode: EditMode.CREATE,
    });
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
