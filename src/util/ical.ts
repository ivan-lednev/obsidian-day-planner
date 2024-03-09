import moment, { Moment } from "moment";
import { tz } from "moment-timezone";
import ical from "node-ical";

import {
  defaultDurationMinutes,
  originalRecurrenceDayKeyFormat,
} from "../constants";
import { Task, UnscheduledTask } from "../types";

import { getId } from "./id";
import { getMinutesSinceMidnight } from "./moment";

export function canHappenAfter(icalEvent: ical.VEvent, date: Date) {
  if (!icalEvent.rrule) {
    return icalEvent.end > date;
  }

  return (
    icalEvent.rrule.options.until === null ||
    icalEvent.rrule.options.until > date
  );
}

function hasRecurrenceOverride(icalEvent: ical.VEvent, date: Date) {
  if (!icalEvent.recurrences) {
    return false;
  }

  const dateKey = moment(date).format(originalRecurrenceDayKeyFormat);

  return Object.hasOwn(icalEvent.recurrences, dateKey);
}

export function icalEventToTasks(icalEvent: ical.VEvent, day: Moment) {
  if (icalEvent.rrule) {
    // todo: don't clone and modify them every single time
    const startOfDay = day.clone().startOf("day").toDate();
    const endOfDay = day.clone().endOf("day").toDate();

    const recurrenceOverrides = Object.values(icalEvent?.recurrences || {}).map(
      (recurrence) => {
        // todo: fix
        // @ts-ignore
        recurrence.calendar = icalEvent.calendar;

        return icalEventToTask(recurrence, recurrence.start);
      },
    );

    const recurrences = icalEvent.rrule
      ?.between(startOfDay, endOfDay)
      .filter((date) => !hasRecurrenceOverride(icalEvent, date))
      .map((date) => icalEventToTask(icalEvent, date));

    return [...recurrences, ...recurrenceOverrides];
  }

  // todo: do this once
  const eventStart = window.moment(icalEvent.start);
  const startsOnVisibleDay = day.isSame(eventStart, "day");

  if (startsOnVisibleDay) {
    return icalEventToTask(icalEvent, icalEvent.start);
  }
}

function icalEventToTask(
  icalEvent: ical.VEvent,
  date: Date,
): Task | UnscheduledTask {
  let startTimeAdjusted = window.moment(date);
  const tzid = icalEvent.rrule?.origOptions?.tzid;

  if (tzid) {
    startTimeAdjusted = adjustForDst(tzid, icalEvent.start, date);
    startTimeAdjusted = adjustForOtherZones(tzid, startTimeAdjusted.toDate());
  }

  const isAllDayEvent = icalEvent.datetype === "date";

  const base = {
    // @ts-ignore
    calendar: icalEvent.calendar,
    id: getId(),
    text: icalEvent.summary,
    firstLineText: icalEvent.summary,
    startTime: startTimeAdjusted,
    readonly: true,
    listTokens: "- ",
  };

  if (isAllDayEvent) {
    return {
      ...base,
      durationMinutes: defaultDurationMinutes,
    };
  }

  return {
    ...base,
    startMinutes: getMinutesSinceMidnight(startTimeAdjusted),
    durationMinutes:
      (icalEvent.end.getTime() - icalEvent.start.getTime()) / 1000 / 60,
  };
}

function adjustForOtherZones(tzid: string, currentDate: Date) {
  const localTzid = tz.guess();

  if (tzid === localTzid) {
    return moment(currentDate);
  }

  const localTimezone = tz.zone(localTzid);
  const originalTimezone = tz.zone(tzid);

  if (!localTimezone || !originalTimezone) {
    return moment(currentDate);
  }

  const offset =
    localTimezone.utcOffset(currentDate.getTime()) -
    originalTimezone.utcOffset(currentDate.getTime());

  return moment(currentDate).add(offset, "minutes");
}

function adjustForDst(tzid: string, originalDate: Date, currentDate: Date) {
  const timezone = tz.zone(tzid);

  if (!timezone) {
    return moment(currentDate);
  }

  const offset =
    timezone.utcOffset(currentDate.getTime()) -
    timezone.utcOffset(originalDate.getTime());

  return moment(currentDate).add(offset, "minutes");
}
