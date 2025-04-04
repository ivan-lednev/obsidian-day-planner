import type { Moment } from "moment";
import { mount, unmount } from "svelte";
import { derived, type Readable, type Writable } from "svelte/store";

import { statusBarTextLimit } from "../../constants";
import { currentTime } from "../../global-store/current-time";
import type { Task, WithTime } from "../../task-types";
import { ellipsis } from "../../util/ellipsis";
import { getDiffInMinutes } from "../../util/moment";
import { getEndTime, getOneLineSummary } from "../../util/task-utils";
import StatusBarWidget from "../components/status-bar-widget.svelte";

import type { DateRanges } from "./use-date-ranges";

import type DayPlanner from "src/main";

interface UseStatusBarWidgetProps {
  tasksWithTimeForToday: Readable<Array<WithTime<Task>>>;
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

export function minutesToTimestamp(minutes: number) {
  return window.moment
    .utc(window.moment.duration(minutes, "minutes").asMilliseconds())
    .format("HH:mm");
}

export function mountStatusBarWidget(props: {
  plugin: DayPlanner;
  errorStore: Writable<Error | undefined>;
  dateRanges: DateRanges;
  tasksWithTimeForToday: Readable<Array<WithTime<Task>>>;
}) {
  const { plugin, tasksWithTimeForToday, errorStore, dateRanges } = props;

  const statusBarWidgetContainer = plugin.addStatusBarItem();

  const { untrack } = dateRanges.trackRange([window.moment()]);

  const component = mount(StatusBarWidget, {
    target: statusBarWidgetContainer,
    props: {
      onClick: plugin.initTimelineLeaf,
      tasksWithTimeForToday,
      errorStore,
    },
  });

  return async () => {
    untrack();

    await unmount(component);
  };
}

export function useStatusBarWidget({
  tasksWithTimeForToday,
}: UseStatusBarWidgetProps) {
  return derived(
    [tasksWithTimeForToday, currentTime],
    ([$tasksWithTimeForToday, $currentTime]) => {
      const currentItem = $tasksWithTimeForToday.find(
        (item) =>
          item.startTime.isBefore($currentTime) &&
          getEndTime(item).isAfter($currentTime),
      );

      // TODO: add tests
      const nextItem = $tasksWithTimeForToday
        .slice()
        // todo: remote dupilcation
        .sort((a, b) => a.startTime.diff(b.startTime))
        .find((task) => task.startTime.isAfter($currentTime));

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
