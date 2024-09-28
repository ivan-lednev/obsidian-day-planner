import moment, { type Moment } from "moment";
import { tz } from "moment-timezone";
import ical, { type AttendeePartStat } from "node-ical";

import { fallbackPartStat, noTitle, icalDayKeyFormat } from "../constants";
import type { RemoteTask, WithTime } from "../task-types";
import type { WithIcalConfig } from "../types";

import { getId } from "./id";
import { liftToArray } from "./lift";
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

  return Object.keys(icalEvent.exdate).includes(getIcalDayKey(date));
}

export function icalEventToTasks(
  icalEvent: WithIcalConfig<ical.VEvent>,
  day: Moment,
) {
  if (icalEvent.rrule) {
    const startOfDay = day.clone().startOf("day").toDate();
    const endOfDay = day.clone().endOf("day").toDate();

    const recurrenceOverrides = Object.values(icalEvent?.recurrences || {}).map(
      (recurrence) =>
        icalEventToTask(
          { ...recurrence, calendar: icalEvent.calendar },
          recurrence.start,
        ),
    );

    const recurrences = icalEvent.rrule
      ?.between(startOfDay, endOfDay)
      .filter(
        (date) =>
          !hasRecurrenceOverrideForDate(icalEvent, date) &&
          !hasExceptionForDate(icalEvent, date),
      )
      .map((date) => icalEventToTask(icalEvent, date));

    return [...recurrences, ...recurrenceOverrides];
  }

  const eventStart = window.moment(icalEvent.start);
  const startsOnVisibleDay = day.isSame(eventStart, "day");

  if (startsOnVisibleDay) {
    return icalEventToTask(icalEvent, icalEvent.start);
  }
}

function icalEventToTask(
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

  const base = {
    id: getId(),
    calendar: icalEvent.calendar,
    summary: icalEvent.summary || noTitle,
    startTime: startTimeAdjusted,
    rsvpStatus,
  };

  if (isAllDayEvent) {
    return base;
  }

  return {
    ...base,
    startMinutes: getMinutesSinceMidnight(startTimeAdjusted),
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
