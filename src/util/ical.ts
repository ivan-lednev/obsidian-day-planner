import { Moment } from "moment";
import ical from "node-ical";

import { defaultDurationMinutes } from "../constants";

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

export function icalEventToTasks(icalEvent: ical.VEvent, days: Moment[]) {
  if (icalEvent.rrule) {
    return days.flatMap((day) => {
      // todo: don't clone and modify them every single time
      const startOfDay = day.clone().startOf("day").toDate();
      const endOfDay = day.clone().endOf("day").toDate();

      return icalEvent.rrule
        ?.between(startOfDay, endOfDay)
        .map((date) => icalEventToTask(icalEvent, date));
    });
  }

  // todo: handle recurrences
  //  why does muness ignore rrule if tasks have recurrences?

  // todo: do this once
  const eventStart = window.moment(icalEvent.start);
  const startsOnVisibleDay = days.some((day) => day.isSame(eventStart, "day"));

  if (startsOnVisibleDay) {
    // todo: default to .start inside function
    return icalEventToTask(icalEvent, icalEvent.start);
  }
}

function icalEventToTask(icalEvent: ical.VEvent, date: Date) {
  const startTime = window.moment(date);
  const isAllDayEvent = icalEvent.datetype === "date";
  const base = {
    id: getId(),
    text: icalEvent.summary,
    firstLineText: icalEvent.summary,
    startTime,
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
    startMinutes: getMinutesSinceMidnight(startTime),
    durationMinutes:
      (icalEvent.end.getTime() - icalEvent.start.getTime()) / 1000 / 60,
  };
}
