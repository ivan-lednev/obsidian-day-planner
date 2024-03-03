import moment, { Moment } from "moment";
import { tz } from "moment-timezone";
import ical from "node-ical";

import { defaultDurationMinutes } from "../constants";
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

export function icalEventToTasks(icalEvent: ical.VEvent, day: Moment) {
  if (icalEvent.rrule) {
    // todo: don't clone and modify them every single time
    const startOfDay = day.clone().startOf("day").toDate();
    const endOfDay = day.clone().endOf("day").toDate();

    return icalEvent.rrule
      ?.between(startOfDay, endOfDay)
      .map((date) => icalEventToTask(icalEvent, date));
  }

  // todo: handle recurrences
  //  why does muness ignore rrule if tasks have recurrences?

  // todo: do this once
  const eventStart = window.moment(icalEvent.start);
  const startsOnVisibleDay = day.isSame(eventStart, "day");

  if (startsOnVisibleDay) {
    // todo: default to .start inside function
    return icalEventToTask(icalEvent, icalEvent.start);
  }
}

function icalEventToTask(
  icalEvent: ical.VEvent,
  date: Date,
): Task | UnscheduledTask {
  const startTime = window.moment(date);

  let startTimeAdjusted = startTime;
  const tzid = icalEvent.rrule?.origOptions?.tzid;

  if (tzid) {
    startTimeAdjusted = adjustForDst(tzid, icalEvent.start, date);
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
