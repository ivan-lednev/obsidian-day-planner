import { Array, pipe } from "effect";
import type { Moment } from "moment";

import { addHorizontalPlacing } from "./overlap/overlap";
import type { DayPlannerSettings } from "./settings";
import type {
  LogTimeBlock,
  TimeBlock,
  TimelineTimeBlock,
  WithDuration,
} from "./time-block-types";
import * as m from "./util/moment";
import * as t from "./util/time-block-utils";

export function getVisibleTimeBlocks<Block extends { task?: string }>(
  timeBlocks: Block[],
  settings: DayPlannerSettings,
): Block[] {
  if (settings.showCompletedTasks) {
    return timeBlocks;
  }

  return timeBlocks.filter((it) => !t.isCompleted(it.task));
}

function spansMoreThanOneDay(timeBlock: WithDuration<TimeBlock>) {
  return t.getEndTime(timeBlock).diff(timeBlock.startTime, "days") > 1;
}

function splitAcrossDays<Block extends WithDuration<TimeBlock>>(
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

function toDayChunks(timeBlock: TimelineTimeBlock): TimelineTimeBlock[] {
  if (!t.isWithDuration(timeBlock) || timeBlock.isAllDayEvent) {
    return [timeBlock];
  }

  if (spansMoreThanOneDay(timeBlock)) {
    return [timeBlock];
  }

  return splitAcrossDays(timeBlock);
}

export function groupTimedBlocksByDay(timeBlocks: TimelineTimeBlock[]) {
  return timeBlocks
    .filter((timeBlock) => !timeBlock.isAllDayEvent)
    .flatMap(toDayChunks)
    .reduce<Record<string, TimelineTimeBlock[]>>((result, timeBlock) => {
      const key = t.getDayKey(timeBlock.startTime);

      if (!result[key]) {
        result[key] = [];
      }

      result[key].push(timeBlock);

      return result;
    }, {});
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

/**
 * Log blocks get clipped to the day instead of being split at midnight like
 * planner blocks: a clock that ran across midnight shows up in every day it
 * touches as a partial block. A clock that is still running gets marked as
 * continuing past the bottom of today's column.
 */
export function layOutLogDayColumn(props: {
  timeBlocks: LogTimeBlock[];
  day: Moment;
  currentTime: Moment;
}) {
  const { timeBlocks, day, currentTime } = props;

  const startOfDay = day.clone().startOf("day");
  const clampRange = {
    start: startOfDay,
    end: m.toMinutePrecision(day.clone().endOf("day")),
  };
  const isDayToday = day.isSame(currentTime, "day");

  return pipe(
    timeBlocks,
    Array.filter((timeBlock) =>
      m.doesOverlapWithRange(
        { start: timeBlock.startTime, end: t.getEndTime(timeBlock) },
        { start: startOfDay, end: startOfDay.clone().add(1, "day") },
      ),
    ),
    Array.map((timeBlock) => {
      const clamped = t.clampToTimeRange(timeBlock, clampRange);

      return timeBlock.isRunning && isDayToday
        ? { ...clamped, truncated: ["bottom" as const] }
        : clamped;
    }),
    addHorizontalPlacing,
  );
}
