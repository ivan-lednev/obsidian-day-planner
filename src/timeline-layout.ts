import { Array, pipe } from "effect";

import { addHorizontalPlacing } from "./overlap/overlap";
import type { DayPlannerSettings } from "./settings";
import type {
  TimeBlock,
  TimelineTimeBlock,
  WithDuration,
  WithPlacing,
} from "./time-block-types";
import * as m from "./util/moment";
import * as t from "./util/time-block-utils";

export type TimeBlocksForDay = {
  withTime: TimelineTimeBlock[];
  noTime: TimelineTimeBlock[];
};

export type PlacedTimeBlocksForDay = {
  withTime: Array<WithPlacing<WithDuration<TimelineTimeBlock>>>;
  noTime: TimelineTimeBlock[];
};

export function getEmptyTimeBlocksForDay(): TimeBlocksForDay {
  return { withTime: [], noTime: [] };
}

export function getVisibleTimeBlocks<Block extends { task?: string }>(
  timeBlocks: Block[],
  settings: DayPlannerSettings,
): Block[] {
  if (settings.showCompletedTasks) {
    return timeBlocks;
  }

  return timeBlocks.filter((it) => !t.isCompleted(it.task));
}

export function spansMoreThanOneDay(timeBlock: WithDuration<TimeBlock>) {
  return t.getEndTime(timeBlock).diff(timeBlock.startTime, "days") > 1;
}

export function splitAcrossDays<Block extends WithDuration<TimeBlock>>(
  timeBlock: Block,
): Block[] {
  return m
    .splitMultiday(timeBlock.startTime, t.getEndTime(timeBlock))
    .map(([startTime, endTime]) => ({
      ...timeBlock,
      startTime,
      durationMinutes: m.getDiffInMinutes(startTime, endTime),
    }));
}

export function toDayChunks(timeBlock: TimelineTimeBlock): TimelineTimeBlock[] {
  if (!t.isWithDuration(timeBlock) || timeBlock.isAllDayEvent) {
    return [timeBlock];
  }

  if (spansMoreThanOneDay(timeBlock)) {
    return [timeBlock];
  }

  return splitAcrossDays(timeBlock);
}

export function groupTimeBlocksByDay(timeBlocks: TimelineTimeBlock[]) {
  return timeBlocks.reduce<Record<string, TimeBlocksForDay>>(
    (result, timeBlock) => {
      const key = t.getDayKey(timeBlock.startTime);

      if (!result[key]) {
        result[key] = getEmptyTimeBlocksForDay();
      }

      if (timeBlock.isAllDayEvent) {
        result[key].noTime.push(timeBlock);
      } else {
        result[key].withTime.push(timeBlock);
      }

      return result;
    },
    {},
  );
}

function overlapsRange(timeBlock: TimelineTimeBlock, range: m.Range) {
  if (t.isWithDuration(timeBlock)) {
    return m.doesOverlapWithRange(
      { start: timeBlock.startTime, end: t.getEndTime(timeBlock) },
      {
        start: range.start.clone().startOf("day"),
        end: range.end.clone().add(1, "day").startOf("day"),
      },
    );
  }

  return m.isWithinRange(timeBlock.startTime, range);
}

export function getAllDayTimeBlocksInRange(
  timeBlocks: TimelineTimeBlock[],
  range: m.Range,
): TimelineTimeBlock[] {
  return timeBlocks
    .filter(
      // TODO: a limitation to be removed later
      (timeBlock) => timeBlock.isAllDayEvent && overlapsRange(timeBlock, range),
    )
    .map(
      (timeBlock): TimelineTimeBlock =>
        t.isWithDuration(timeBlock)
          ? t.truncateToDayRange(timeBlock, range)
          : timeBlock,
    );
}

export function layOutDayColumn(
  timeBlocks: Array<WithDuration<TimelineTimeBlock>>,
) {
  return pipe(
    timeBlocks,
    Array.dedupeWith((a, b) => t.getRenderKey(a) === t.getRenderKey(b)),
    addHorizontalPlacing,
  );
}
