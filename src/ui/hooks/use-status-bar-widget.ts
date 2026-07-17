import type { Moment } from "moment";
import { mount, unmount } from "svelte";
import { derived, type Readable } from "svelte/store";

import { statusBarTextLimit } from "../../constants";
import { currentTime } from "../../global-store/current-time";
import type DayPlanner from "../../main";
import type { RootState } from "../../redux/store";
import type { UseSelector } from "../../redux/use-selector";
import type { LogEntryEditor } from "../../service/log-entry-editor";
import type { WorkspaceFacade } from "../../service/workspace-facade";
import type { TimeBlock, WithDuration } from "../../time-block-types";
import { ellipsis } from "../../util/ellipsis";
import { getDiffInMinutes } from "../../util/moment";
import { getEndTime, getOneLineSummary } from "../../util/time-block-utils";
import StatusBarWidget from "../components/status-bar-widget.svelte";
import type { OpenEditTimeEntryModal } from "../create-edit-time-entry-modal";

import type { DateRanges } from "./use-date-ranges";

interface UseStatusBarWidgetProps {
  tasksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
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
  dateRanges: DateRanges;
  tasksWithTimeForToday: Readable<Array<WithDuration<TimeBlock>>>;
  useSelector: UseSelector<RootState>;
  logEntryEditor: LogEntryEditor;
  workspaceFacade: WorkspaceFacade;
  openEditTimeEntryModal: OpenEditTimeEntryModal;
  openClockInOnAnythingModal: () => void;
}) {
  const {
    plugin,
    tasksWithTimeForToday,
    dateRanges,
    useSelector,
    logEntryEditor,
    workspaceFacade,
    openEditTimeEntryModal,
    openClockInOnAnythingModal,
  } = props;

  const statusBarWidgetContainer = plugin.addStatusBarItem();

  statusBarWidgetContainer.removeClasses(["status-bar-item"]);
  statusBarWidgetContainer.addClass("planner-status-bar-widget-root");

  const { untrack } = dateRanges.trackRange([window.moment()]);

  const component = mount(StatusBarWidget, {
    target: statusBarWidgetContainer,
    props: {
      onClick: plugin.initTimelineLeaf,
      tasksWithTimeForToday,
      useSelector,
      logEntryEditor,
      workspaceFacade,
      openEditTimeEntryModal,
      openClockInOnAnythingModal,
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
