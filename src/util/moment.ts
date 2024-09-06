import { range } from "lodash/fp";
import type { Moment } from "moment/moment";

import type { RelationToNow } from "../types";

const moment = window.moment;

const defaultTimestampFormat = "hh:mm";

export function getMinutesSinceMidnight(moment: Moment) {
  return moment.diff(moment.clone().startOf("day"), "minutes");
}

export function toMinutes(time: string) {
  const parsed = moment(time, defaultTimestampFormat);

  return getMinutesSinceMidnight(parsed);
}

export function getDiffInMinutes(a: Moment, b: Moment) {
  return Math.abs(a.diff(b, "minutes"));
}

export function getDaysOfCurrentWeek() {
  return getDaysOfWeek(window.moment());
}

export function getDaysOfWeek(moment: Moment) {
  const firstDay = moment.clone().startOf("isoWeek");

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

export function hoursToMoment(hoursSinceMidnight: number) {
  return moment().startOf("day").add(hoursSinceMidnight, "hours");
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

export function splitMultiday(
  start: Moment,
  end: Moment,
  chunks: Array<[Moment, Moment]> = [],
): Array<[Moment, Moment]> {
  const endOfDayForStart = start.clone().endOf("day");

  if (end.isBefore(endOfDayForStart)) {
    return [...chunks, [start, end]];
  }

  const newStart = start.clone().add(1, "day").startOf("day");

  return splitMultiday(newStart, end, [...chunks, [start, endOfDayForStart]]);
}

export function getEarliestMoment(moments: Moment[]) {
  return moments.reduce((result, current) => {
    if (current.isBefore(result)) {
      return current;
    }

    return result;
  });
}
