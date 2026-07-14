import { flow, uniqBy } from "lodash/fp";
import type { Moment } from "moment";
import { derived, type Readable, writable } from "svelte/store";

import { addHorizontalPlacing } from "../../../overlap/overlap";
import type { PeriodicNotes } from "../../../service/periodic-notes";
import { WorkspaceFacade } from "../../../service/workspace-facade";
import type { DayPlannerSettings } from "../../../settings";
import type {
  EditableTimeBlock,
  RemoteTimeBlock,
  TimelineTimeBlock,
  WithPlacing,
  WithDuration,
} from "../../../time-block-types";
import type {
  OnEditAbortedFn,
  OnUpdateFn,
  PointerDateTime,
} from "../../../types";
import * as m from "../../../util/moment";
import * as t from "../../../util/time-block-utils";

import { createEditHandlers } from "./create-edit-handlers";
import { useCursor } from "./cursor";
import { transform } from "./transform/transform";
import type { EditOperation } from "./types";
import { useEditActions } from "./use-edit-actions";

function groupByDay(timeBlocks: TimelineTimeBlock[]) {
  return timeBlocks.reduce<
    Record<
      string,
      { withTime: TimelineTimeBlock[]; noTime: TimelineTimeBlock[] }
    >
  >((result, timeBlock) => {
    const key = t.getDayKey(timeBlock.startTime);

    if (!result[key]) {
      result[key] = { withTime: [], noTime: [] };
    }

    if (timeBlock.isAllDayEvent) {
      result[key].noTime.push(timeBlock);
    } else {
      result[key].withTime.push(timeBlock);
    }

    return result;
  }, {});
}

export function useEditContext(props: {
  workspaceFacade: WorkspaceFacade;
  periodicNotes: PeriodicNotes;
  onUpdate: OnUpdateFn;
  settings: Readable<DayPlannerSettings>;
  localTasks: Readable<EditableTimeBlock[]>;
  remoteTasks: Readable<RemoteTimeBlock[]>;
  pointerDateTime: Readable<PointerDateTime>;
  abortEditTrigger: Readable<unknown>;
  onEditAborted: OnEditAbortedFn;
}) {
  const {
    workspaceFacade,
    periodicNotes,
    onEditAborted,
    onUpdate,
    settings,
    localTasks: localTimeBlocks,
    remoteTasks: remoteTimeBlocks,
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
    [localTimeBlocks, settings],
    ([$localTimeBlocks, $settings]) =>
      $settings.showCompletedTasks
        ? $localTimeBlocks
        : $localTimeBlocks.filter(
            (it) => !it.task || it.task.toLowerCase() !== "x",
          ),
  );

  const baselineTimeBlocks = writable<EditableTimeBlock[]>([], (set) => {
    return localFilteredTimeBlocks.subscribe(set);
  });

  const timeBlocksWithPendingUpdate = derived(
    [editOperation, baselineTimeBlocks, settings, pointerDateTime],
    ([$editOperation, $baselineTimeBlocks, $settings, $pointerDateTime]) => {
      return $editOperation
        ? transform(
            $baselineTimeBlocks,
            $editOperation,
            $settings,
            $pointerDateTime,
          )
        : $baselineTimeBlocks;
    },
  );

  const { startEdit, confirmEdit, cancelEdit } = useEditActions({
    editOperation,
    baselineTasks: baselineTimeBlocks,
    tasksWithPendingUpdate: timeBlocksWithPendingUpdate,
    onUpdate,
  });

  const handlers = createEditHandlers({
    periodicNotes,
    pointerDateTime,
    workspaceFacade,
    startEdit,
    editOperation,
    settings,
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

  const dayToDisplayedTimeBlocks = derived(
    combinedTimeBlocks,
    ($combinedTimeBlocks) => {
      const split: TimelineTimeBlock[] = $combinedTimeBlocks.flatMap(
        (timeBlock): TimelineTimeBlock[] | TimelineTimeBlock => {
          if (!t.isWithDuration(timeBlock) || timeBlock.isAllDayEvent) {
            return timeBlock;
          }

          const daySpan = t
            .getEndTime(timeBlock)
            .diff(timeBlock.startTime, "days");
          const shouldGoToMultiDayRow = daySpan > 1;

          if (shouldGoToMultiDayRow) {
            return timeBlock;
          }

          const chunks = m.splitMultiday(
            timeBlock.startTime,
            t.getEndTime(timeBlock),
          );

          return chunks.map(([startTime, endTime]) => ({
            ...timeBlock,
            startTime,
            durationMinutes: m.getDiffInMinutes(startTime, endTime),
          }));
        },
      );

      return groupByDay(split);
    },
  );

  const getDisplayedAllDayTimeBlocksForMultiDayRow = derived(
    [combinedTimeBlocks],
    ([$combinedTimeBlocks]) =>
      (range: m.Range) => {
        const startOfRange = range.start.clone().startOf("day");
        const endOfRange = range.end.clone().add(1, "day").startOf("day");

        return $combinedTimeBlocks
          .filter((timeBlock) => {
            // TODO: a limitation to be removed later
            if (!timeBlock.isAllDayEvent) {
              return false;
            }

            if (t.isWithDuration(timeBlock)) {
              return m.doesOverlapWithRange(
                {
                  start: timeBlock.startTime,
                  end: t.getEndTime(timeBlock),
                },
                { start: startOfRange, end: endOfRange },
              );
            }

            return m.isWithinRange(timeBlock.startTime, range);
          })
          .map(
            (timeBlock): TimelineTimeBlock =>
              t.isWithDuration(timeBlock)
                ? t.truncateToRange(timeBlock, range)
                : timeBlock,
          );
      },
  );

  function getDisplayedTimeBlocksForTimeline(day: Moment) {
    return derived(dayToDisplayedTimeBlocks, ($dayToDisplayedTimeBlocks) => {
      const timeBlocksForDay =
        $dayToDisplayedTimeBlocks[t.getDayKey(day)] ||
        t.getEmptyTimeBlocksForDay();

      const withTime: Array<WithPlacing<WithDuration<TimelineTimeBlock>>> =
        flow(
          uniqBy(t.getRenderKey),
          addHorizontalPlacing,
        )(timeBlocksForDay.withTime);

      return {
        ...timeBlocksForDay,
        withTime,
      };
    });
  }

  return {
    handlers,
    cursor,
    dayToDisplayedTasks: dayToDisplayedTimeBlocks,
    confirmEdit,
    cancelEdit,
    editOperation,
    getDisplayedTasksForTimeline: getDisplayedTimeBlocksForTimeline,
    getDisplayedAllDayTasksForMultiDayRow:
      getDisplayedAllDayTimeBlocksForMultiDayRow,
  };
}
