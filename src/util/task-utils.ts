import { produce } from "immer";
import { flow } from "lodash/fp";
import type { Moment } from "moment";
import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";

import { defaultDayFormat } from "../constants";
import { settings } from "../global-store/settings";
import { replaceOrPrependTimestamp } from "../parser/parser";
import {
  looseTimestampAtStartOfLineRegExp,
  obsidianBlockIdRegExp,
  scheduledPropRegExps,
  shortScheduledPropRegExp,
  strictTimestampAnywhereInLineRegExp,
} from "../regexp";
import type { DayPlannerSettings } from "../settings";
import {
  type BaseTask,
  isRemote,
  type LocalTask,
  type RemoteTask,
  type Task,
  type TaskLocation,
  type WithTime,
} from "../task-types";
import { EditMode } from "../ui/hooks/use-edit/types";

import { createMarkdownListTokens } from "./dataview";
import { getId } from "./id";
import { getFirstLine, getLinesAfterFirst, removeListTokens } from "./markdown";
import * as m from "./moment";
import {
  addMinutes,
  getMinutesSinceMidnight,
  minutesToMoment,
  minutesToMomentOfDay,
} from "./moment";
import { addTasksPluginProp, updateScheduledPropInText } from "./props";

export function getEndMinutes(task: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return getMinutesSinceMidnight(task.startTime) + task.durationMinutes;
}

export function getEndTime(task: {
  startTime: Moment;
  durationMinutes: number;
}) {
  return task.startTime.clone().add(task.durationMinutes, "minutes");
}

// todo: remove this inconsistency
export function isWithTime<T extends Task>(task: T): task is WithTime<T> {
  return Object.hasOwn(task, "startTime") || !task.isAllDayEvent;
}

const keySeparator = ":";

function getRemoteTaskIdentity(task: RemoteTask) {
  const key: string[] = [];

  key.push(task.calendar.name, task.startTime.toISOString(false), task.summary);

  return key.join(keySeparator);
}

export function getRenderKey(task: WithTime<Task> | Task) {
  if (isRemote(task)) {
    return getRemoteTaskIdentity(task);
  }

  const key: string[] = [];

  if (isWithTime(task)) {
    key.push(
      String(getMinutesSinceMidnight(task.startTime)),
      String(getEndMinutes(task)),
    );
  }

  if (task.location) {
    const {
      path,
      position: {
        start: { line },
      },
    } = task.location;

    key.push(path, String(line));
  }

  key.push(task.text);

  return key.join(keySeparator);
}

export function getNotificationKey(task: WithTime<Task>) {
  if (isRemote(task)) {
    return getRemoteTaskIdentity(task);
  }

  const key: string[] = [];

  key.push(
    task.location?.path ?? "blank",
    String(getMinutesSinceMidnight(task.startTime)),
    String(task.durationMinutes),
    task.text,
  );

  return key.join(keySeparator);
}

/**
 * Tasks with date prop are copied under the original task, tasks from daily
 * notes get sent under a heading based on the new date.
 */
export function copy(original: WithTime<LocalTask>): WithTime<LocalTask> {
  let location: TaskLocation | undefined;

  if (hasDateFromProp(original)) {
    const originalLocation = original.location;

    isNotVoid(
      originalLocation,
      `Did not find location on task$ ${getOneLineSummary(original)}`,
    );

    location = produce(originalLocation, (draft) => {
      draft.position.start.line = draft.position.end.line + 1;
    });
  }

  return {
    ...original,
    location,
    id: getId(),
  };
}

export function createTimestamp(
  startMinutes: number,
  durationMinutes: number,
  format: string,
) {
  const start = minutesToMoment(startMinutes);
  const end = addMinutes(start, durationMinutes);

  return `${start.format(format)} - ${end.format(format)}`;
}

export function getEmptyTasksForDay() {
  return { withTime: [], noTime: [] };
}

export function getDayKey(day: Moment) {
  return day.format(defaultDayFormat);
}

export function toString(task: WithTime<LocalTask>, mode: EditMode) {
  const firstLineWithoutListTokens = removeListTokens(getFirstLine(task.text));

  const updatedTimestamp = createTimestamp(
    getMinutesSinceMidnight(task.startTime),
    task.durationMinutes,
    get(settings).timestampFormat,
  );
  const listTokens = createMarkdownListTokens(task);

  const withUpdatedOrDeletedTimestamp = task.isAllDayEvent
    ? removeTimestamp(firstLineWithoutListTokens)
    : replaceOrPrependTimestamp(firstLineWithoutListTokens, updatedTimestamp);

  let updatedFirstLineText = updateScheduledPropInText(
    withUpdatedOrDeletedTimestamp,
    getDayKey(task.startTime),
  );

  // todo: should not be conditional
  // todo: remove the hack
  if (
    mode === EditMode.SCHEDULE_SEARCH_RESULT &&
    !shortScheduledPropRegExp.test(updatedFirstLineText)
  ) {
    updatedFirstLineText = addTasksPluginProp(
      updatedFirstLineText,
      `⏳ ${task.startTime.format(defaultDayFormat)}`,
    );
  }

  const otherLines = getLinesAfterFirst(task.text);

  let result = `${listTokens} ${updatedFirstLineText}`;

  if (otherLines) {
    result += "\n";
    result += otherLines;
  }

  return result;
}

export function appendText(taskText: string, toAppend: string) {
  const blockIdMatch = obsidianBlockIdRegExp.exec(taskText);

  if (blockIdMatch) {
    const blockId = blockIdMatch[0];

    return taskText.slice(0, blockIdMatch.index) + toAppend + blockId;
  }

  return taskText + toAppend;
}

export function create(props: {
  day: Moment;
  startMinutes: number;
  settings: DayPlannerSettings;
  text?: string;
  location?: TaskLocation;
  status?: string;
  isAllDayEvent?: boolean;
}): WithTime<LocalTask> {
  const {
    day,
    startMinutes,
    settings,
    location,
    text = "New item",
    status,
    isAllDayEvent = false,
  } = props;

  return {
    location,
    id: getId(),
    durationMinutes: settings.defaultDurationMinutes,
    text,
    startTime: minutesToMomentOfDay(startMinutes, day),
    isAllDayEvent,
    symbol: "-",
    status:
      status || settings.eventFormatOnCreation === "task"
        ? settings.taskStatusOnCreation
        : undefined,
  };
}

export function getOneLineSummary(task: Task) {
  if (isRemote(task)) {
    return task.summary;
  }

  return flow(
    getFirstLine,
    removeListTokens,
    removeTimestampFromStart,
  )(task.text);
}

export function truncateToRange(task: WithTime<Task>, range: m.Range) {
  const start = task.startTime.clone().startOf("day");
  const end = getEndTime(task).clone().endOf("day");

  const startOfRange = range.start.clone().startOf("day");
  const endOfRange = range.end.clone().add(1, "day").startOf("day");

  const truncatedBase = { ...task };

  if (start.isBefore(startOfRange)) {
    truncatedBase.durationMinutes = getEndTime(task).diff(
      startOfRange,
      "minutes",
    );

    truncatedBase.startTime = startOfRange;
    truncatedBase.truncated = [...(truncatedBase.truncated ?? []), "left"];
  }

  if (end.isAfter(endOfRange)) {
    truncatedBase.durationMinutes = m.getDiffInMinutes(
      truncatedBase.startTime,
      endOfRange,
    );

    truncatedBase.truncated = [...(truncatedBase.truncated ?? []), "right"];
  }

  return truncatedBase;
}

export function removeTimestampFromStart(text: string) {
  return text.replace(looseTimestampAtStartOfLineRegExp, "");
}

export function removeTimestamp(text: string) {
  const withoutTimestampAtStart = removeTimestampFromStart(text);
  const withoutTimestampInMiddle = withoutTimestampAtStart.replace(
    strictTimestampAnywhereInLineRegExp,
    "",
  );

  return withoutTimestampInMiddle.trim().replace(/\s+/g, " ");
}

export function isTimeEqual(a: LocalTask, b: LocalTask) {
  return (
    a.startTime.isSame(b.startTime) &&
    a.durationMinutes === b.durationMinutes &&
    a.isAllDayEvent === b.isAllDayEvent
  );
}

export function hasDateFromProp(task: LocalTask) {
  return scheduledPropRegExps.some((regexp) => regexp.test(task.text));
}

export function clamp<T extends WithTime<BaseTask>>(
  timeBlock: T,
  start: Moment,
  end: Moment,
): T {
  const clampedStartTime = timeBlock.startTime.isBefore(start)
    ? start
    : timeBlock.startTime;
  const endTime = getEndTime(timeBlock);
  const clampedEndTime = endTime.isAfter(end) ? end : endTime;
  const clampedDurationMinutes = clampedEndTime.diff(
    clampedStartTime,
    "minutes",
  );

  return {
    ...timeBlock,
    startTime: clampedStartTime,
    durationMinutes: clampedDurationMinutes,
  };
}
