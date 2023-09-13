import { range } from "lodash/fp";
import type { Moment } from "moment/moment";

import type { RelationToNow } from "../types";

const moment = window.moment;

const DEFAULT_TIMESTAMP_FORMAT = "hh:mm";

export function getMinutesSinceMidnight(moment: Moment) {
  return moment.diff(moment.clone().startOf("day"), "minutes");
}

export function timeToMinutes(time: string) {
  const parsed = moment(time, DEFAULT_TIMESTAMP_FORMAT);

  return getMinutesSinceMidnight(parsed);
}

export function getMinutesSinceMidnightOfDayTo(day: Moment, moment: Moment) {
  return getDiffInMinutes(moment, day.clone().startOf("day"));
}

export function getDiffInMinutes(a: Moment, b: Moment) {
  return Math.abs(a.diff(b, "minutes"));
}

export function getDaysOfCurrentWeek() {
  return getDaysOfWeek(window.moment());
}

export function getDaysOfWeek(moment: Moment) {
  const firstDay = moment.clone().startOf("isoWeek");

  // todo: 'only workdays goes here'
  return range(1, 7).reduce(
    (result, dayIndex) => {
      const nextDay = firstDay.clone().add(dayIndex, "day");

      return [...result, nextDay];
    },
    [firstDay],
  );
}

export function minutesToMomentOfDay(
  minutesSinceMidnight: number,
  moment: Moment,
) {
  return moment.clone().startOf("day").add(minutesSinceMidnight, "minutes");
}

export function minutesToMoment(minutesSinceMidnight: number) {
  return moment().startOf("day").add(minutesSinceMidnight, "minutes");
}

export function addMinutes(moment: Moment, minutes: number) {
  return moment.clone().add(minutes, "minutes");
}

export function getRelationToNow(
  now: Moment,
  start: Moment,
  end: Moment,
): RelationToNow {
  if (end.isBefore(now)) {
    return "past";
  }

  if (start.isAfter(now)) {
    return "future";
  }

  return "present";
}

export function isToday(moment: Moment) {
  return moment.isSame(window.moment(), "day");
}
