import moment, { Moment } from "moment";
import { tz } from "moment-timezone";
import ical from "node-ical";

import {
  defaultDurationMinutes,
  noTitle,
  originalRecurrenceDayKeyFormat,
} from "../constants";
import { Task, UnscheduledTask, WithIcalConfig } from "../types";

import { getId } from "./id";
import { getMinutesSinceMidnight } from "./moment";

// Assuming the structure of an Attendee based on your usage
type AttendeeObject = {
  val: string;
  params: {
    PARTSTAT?: string;
  };
};

// Attendee can be either an object or a string
type Attendee = AttendeeObject | string;

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

export function icalEventToTasks(
  icalEvent: WithIcalConfig<ical.VEvent>,
  day: Moment,
) {
  if (icalEvent.rrule) {
    // todo: don't clone and modify them every single time
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
  icalEvent: WithIcalConfig<ical.VEvent>,
  date: Date,
): Task | UnscheduledTask {
  let startTimeAdjusted = window.moment(date);
  const tzid = icalEvent.rrule?.origOptions?.tzid;

  if (tzid) {
    startTimeAdjusted = adjustForDst(tzid, icalEvent.start, date);
    startTimeAdjusted = adjustForOtherZones(tzid, startTimeAdjusted.toDate());
  }

  const isAllDayEvent = icalEvent.datetype === "date";

  // Decode the URL to handle %40 and other encoded characters
  const decodedUrl = decodeURIComponent(icalEvent.calendar.url);

  // Check if the calendar URL matches the Google Calendar URL pattern and extract the email address
  const googleCalendarUrlPattern =
    /https:\/\/calendar\.google\.com\/calendar\/ical\/([^@]+@[^.]+\.[^/]+)\/private-.*/;
  let rsvpStatus = "No RSVP";
  let emailFromUrl = "";

  const match = googleCalendarUrlPattern.exec(decodedUrl);
  if (match) {
    emailFromUrl = `mailto:${match[1]}`;
  }

  // Type guard to check if an attendee is an object
  const isAttendeeObject = (attendee: Attendee): attendee is AttendeeObject => {
    return typeof attendee === 'object' && 'val' in attendee && 'params' in attendee;
  };

  // If we have an email from the URL, find its RSVP status
  if (emailFromUrl && icalEvent.attendee) {
    const attendees = Array.isArray(icalEvent.attendee)
      ? icalEvent.attendee
      : [icalEvent.attendee];

    for (const attendee of attendees) {
      if (isAttendeeObject(attendee) && attendee.val === emailFromUrl) {
        rsvpStatus = attendee.params.PARTSTAT || "No RSVP";
        break;
      }
    }
  }


  const base = {
    calendar: icalEvent.calendar,
    id: getId(),
    text: icalEvent.summary || noTitle,
    firstLineText: icalEvent.summary || noTitle,
    startTime: startTimeAdjusted,
    readonly: true,
    listTokens: "- ",
    rsvpStatus: rsvpStatus,
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
