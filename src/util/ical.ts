import moment, { type Moment } from "moment";
import { tz } from "moment-timezone";
import ical, { type AttendeePartStat } from "node-ical";

import { fallbackPartStat, icalDayKeyFormat } from "../constants";
import type { RemoteTask, WithTime } from "../task-types";
import type { WithIcalConfig } from "../types";

import { getId } from "./id";
import { liftToArray } from "./lift";
import * as m from "./moment";

export function canHappenAfter(icalEvent: ical.VEvent, date: Date) {
  if (!icalEvent.rrule) {
    return icalEvent.end > date;
  }

  return (
    icalEvent.rrule.options.until === null ||
    icalEvent.rrule.options.until > date
  );
}

function hasRecurrenceOverrideForDate(icalEvent: ical.VEvent, date: Date) {
  if (!icalEvent.recurrences) {
    return false;
  }

  return Object.hasOwn(icalEvent.recurrences, getIcalDayKey(date));
}

function getIcalDayKey(date: Date) {
  return moment(date).format(icalDayKeyFormat);
}

function hasExceptionForDate(icalEvent: ical.VEvent, date: Date) {
  if (!icalEvent.exdate) {
    return false;
  }

  // NOTE: exdate contains floating dates, i.e. any UTC offset that's on them
  // must be ignored, and we should treat them as local time
  const asMoment = window.moment(date);
  const utcOffset = asMoment.utcOffset();
  const dateWithoutOffset = asMoment.clone().subtract(utcOffset, "minutes");

  return Object.values(icalEvent.exdate).some((exceptionDate) => {
    if (!(exceptionDate instanceof Date)) {
      throw new Error("Unexpected exdate format");
    }

    return window.moment(exceptionDate).isSame(dateWithoutOffset, "day");
  });
}

export function icalEventToTasksForRange(
  icalEvent: WithIcalConfig<ical.VEvent>,
  start: Moment,
  end: Moment,
) {
  if (!icalEvent.rrule) {
    return onceOffIcalEventToTaskForRange(icalEvent, start, end);
  }

  const tasksFromRecurrenceOverrides = Object.values(
    icalEvent?.recurrences || {},
  ).reduce<RemoteTask[]>((result, override) => {
    const task = onceOffIcalEventToTaskForRange(
      { ...override, calendar: icalEvent.calendar },
      start,
      end,
    );

    if (task) {
      result.push(task);
    }

    return result;
  }, []);

  const recurrences = icalEvent.rrule
    .between(start.toDate(), end.clone().add(1, "day").toDate()) // Note: this calculation is very slow
    .filter(
      (date) =>
        !hasRecurrenceOverrideForDate(icalEvent, date) &&
        !hasExceptionForDate(icalEvent, date),
    );

  const tasksFromRecurrences = recurrences.map((date) =>
    icalEventToTask(icalEvent, date),
  );

  return tasksFromRecurrences.concat(tasksFromRecurrenceOverrides);
}

function onceOffIcalEventToTaskForRange(
  icalEvent: WithIcalConfig<ical.VEvent>,
  start: Moment,
  end: Moment,
) {
  const startOfRange = start.clone().startOf("day");
  const endOfRangeExclusive = end.clone().add(1, "day").startOf("day");

  const eventStart = window.moment(icalEvent.start);
  const eventEnd = window.moment(icalEvent.end);

  if (
    m.doesOverlapWithRange(
      { start: eventStart, end: eventEnd },
      { start: startOfRange, end: endOfRangeExclusive },
    )
  ) {
    return icalEventToTask(icalEvent, icalEvent.start);
  }
}

export function icalEventToTask(
  icalEvent: WithIcalConfig<ical.VEvent>,
  date: Date,
): RemoteTask | WithTime<RemoteTask> {
  let startTimeAdjusted = window.moment(date);
  const tzid = icalEvent.rrule?.origOptions?.tzid;

  if (tzid) {
    startTimeAdjusted = adjustForDst(tzid, icalEvent.start, date);
    startTimeAdjusted = adjustForOtherZones(tzid, startTimeAdjusted.toDate());
  }

  const isAllDayEvent = icalEvent.datetype === "date";
  const rsvpStatus = getRsvpStatus(icalEvent, icalEvent.calendar.email);

  return {
    id: getId(),
    calendar: icalEvent.calendar,
    summary: icalEvent.summary || "(No title)",
    description: icalEvent.description,
    location: icalEvent.location,
    startTime: startTimeAdjusted,
    rsvpStatus,
    isAllDayEvent,
    durationMinutes:
      (icalEvent.end.getTime() - icalEvent.start.getTime()) / 1000 / 60,
  };
}

function getRsvpStatus(event: ical.VEvent, email?: string): AttendeePartStat {
  if (!email?.trim()) {
    return fallbackPartStat;
  }

  const attendeeWithMatchingEmail = liftToArray(event.attendee).find(
    (attendee) => typeof attendee !== "string" && attendee?.params.CN === email,
  );

  if (typeof attendeeWithMatchingEmail === "string") {
    throw new Error("Unexpected attendee format");
  }

  return attendeeWithMatchingEmail?.params.PARTSTAT || fallbackPartStat;
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
