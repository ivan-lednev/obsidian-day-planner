import type { Moment } from "moment";
import { derived, get, type Readable, writable } from "svelte/store";

import type { DayPlannerSettings } from "../../../settings";
import type {
  EditableTimeBlock,
  RemoteTimeBlock,
  TimelineTimeBlock,
  WithDuration,
} from "../../../time-block-types";
import {
  getAllDayTimeBlocksInRange,
  getEmptyTimeBlocksForDay,
  getVisibleTimeBlocks,
  groupTimeBlocksByDay,
  layOutDayColumn,
  type PlacedTimeBlocksForDay,
  toDayChunks,
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
  remoteTimeBlocks: Readable<RemoteTimeBlock[]>;
  pointerDateTime: Readable<PointerDateTime>;
  abortEditTrigger: Readable<unknown>;
  onEditAborted: OnEditAbortedFn;
}) {
  const {
    onEditAborted,
    onUpdate,
    settingsStore,
    localTimeBlocks,
    remoteTimeBlocks,
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

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTimeBlocks,
    timeBlocksWithPendingUpdate,
    onUpdate,
  });

  function startCreate() {
    startEdit({
      timeBlock: t.create({
        startTime: get(pointerDateTime).dateTime,
        settings: get(settingsStore),
      }),
      mode: EditMode.CREATE,
    });
  }

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

  const dayToDisplayedTimeBlocks = derived(
    combinedTimeBlocks,
    ($combinedTimeBlocks) =>
      groupTimeBlocksByDay($combinedTimeBlocks.flatMap(toDayChunks)),
  );

  const getDisplayedAllDayTimeBlocksForMultiDayRow = derived(
    combinedTimeBlocks,
    ($combinedTimeBlocks) => (range: m.Range) =>
      getAllDayTimeBlocksInRange($combinedTimeBlocks, range),
  );

  function getDisplayedTimeBlocksForTimeline(day: Moment) {
    return derived(
      dayToDisplayedTimeBlocks,
      ($dayToDisplayedTimeBlocks): PlacedTimeBlocksForDay => {
        const timeBlocksForDay =
          $dayToDisplayedTimeBlocks[t.getDayKey(day)] ||
          getEmptyTimeBlocksForDay();

        return {
          ...timeBlocksForDay,
          // todo: fix `as`
          withTime: layOutDayColumn(
            timeBlocksForDay.withTime as Array<WithDuration<TimelineTimeBlock>>,
          ),
        };
      },
    );
  }

  return {
    cursor,
    dayToDisplayedTimeBlocks,
    startEdit,
    startCreate,
    confirmEdit,
    cancelEdit,
    editOperation,
    getDisplayedTimeBlocksForTimeline,
    getDisplayedAllDayTimeBlocksForMultiDayRow,
  };
}
