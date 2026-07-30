import type { Moment } from "moment";
import { derived, type Readable } from "svelte/store";

import { statusBarTextLimit } from "../../constants";
import { currentTime } from "../../global-store/current-time";
import type { TimeBlock, WithDuration } from "../../time-block-types";
import { ellipsis } from "../../util/ellipsis";
import { getDiffInMinutes, minutesToTimestamp } from "../../util/moment";
import { getEndTime, getOneLineSummary } from "../../util/time-block-utils";

interface UseStatusBarWidgetProps {
  timeBlocksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
}

interface Widget {
  current?: {
    text: string;
    timeLeft: string;
    percentageComplete: string;
    endTime: Moment;
  };
  next?: {
    text: string;
    timeToNext: string;
  };
}

export function useStatusBarWidget({
  timeBlocksWithTimeForToday,
}: UseStatusBarWidgetProps) {
  return derived(
    [timeBlocksWithTimeForToday, currentTime],
    ([$timeBlocksWithTimeForToday, $currentTime]) => {
      const currentItem = $timeBlocksWithTimeForToday.find(
        (item) =>
          item.startTime.isBefore($currentTime) &&
          getEndTime(item).isAfter($currentTime),
      );

      // TODO: add tests
      const nextItem = $timeBlocksWithTimeForToday
        .slice()
        // todo: remote dupilcation
        .sort((a, b) => a.startTime.diff(b.startTime))
        .find((timeBlock) => timeBlock.startTime.isAfter($currentTime));

      const widget: Widget = {};

      if (currentItem) {
        const minutesFromStart = getDiffInMinutes(
          currentItem.startTime,
          $currentTime,
        );
        const percentageComplete =
          minutesFromStart / (currentItem.durationMinutes / 100);
        const minutesLeft = getDiffInMinutes(
          getEndTime(currentItem),
          window.moment(),
        );
        const timeLeft = minutesToTimestamp(minutesLeft);
        const text = ellipsis(
          getOneLineSummary(currentItem),
          statusBarTextLimit,
        );

        widget.current = {
          percentageComplete: percentageComplete.toFixed(0),
          timeLeft,
          text,
          endTime: getEndTime(currentItem),
        };
      }

      if (nextItem) {
        const minutesToNext = getDiffInMinutes(
          $currentTime,
          nextItem.startTime,
        );
        const timeToNext = minutesToTimestamp(minutesToNext);
        const text = ellipsis(getOneLineSummary(nextItem), statusBarTextLimit);

        widget.next = {
          timeToNext,
          text,
        };
      }

      return widget;
    },
  );
}
