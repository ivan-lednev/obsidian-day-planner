import { Array, pipe } from "effect";
import type { Moment } from "moment";

import { addHorizontalPlacing } from "./overlap/overlap";
import type { DayPlannerSettings } from "./settings";
import type {
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

function isWithinRange(timeBlock: TimeBlock, dayRange: m.Range) {
  if (m.isWithinRange(timeBlock.startTime, dayRange)) {
    return true;
  }

  return (
    t.isWithDuration(timeBlock) &&
    m.doesOverlapWithRange(
      { start: timeBlock.startTime, end: t.getEndTime(timeBlock) },
      dayRange,
    )
  );
}

export function layOutDayColumn<T extends TimeBlock>(props: {
  timeBlocks: T[];
  day: Moment;
}) {
  const { timeBlocks, day } = props;

  const startOfDay = day.clone().startOf("day");
  const dayRange = { start: startOfDay, end: startOfDay.clone().add(1, "day") };

  return pipe(
    timeBlocks,
    Array.filter(
      // todo: filter out `isAllDayEvent` before this
      (timeBlock) =>
        !timeBlock.isAllDayEvent && isWithinRange(timeBlock, dayRange),
    ),
    Array.map((timeBlock) =>
      t.isWithDuration(timeBlock)
        ? // todo: fix `as`: TS cannot relate the generic block type to the helper
          (t.clipToColumnRange(
            timeBlock as WithDuration<TimeBlock>,
            dayRange,
          ) as WithDuration<T>)
        : timeBlock,
    ),
    Array.dedupeWith((a, b) => t.getRenderKey(a) === t.getRenderKey(b)),
    // todo: fix `as`: blocks without a duration can slip through to placing
    (deduped) => addHorizontalPlacing(deduped as Array<WithDuration<T>>),
  );
}
