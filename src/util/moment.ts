import type { Moment } from "moment/moment";
import type { RelationToNow } from "../types";

const moment = window.moment;

export function getMinutesSinceMidnight() {
  return moment().diff(moment().startOf("day"), "minutes");
}

export function getMinutesSinceMidnightTo(someMoment: Moment) {
  return getDiffInMinutes(someMoment, moment().startOf("day"));
}

export function getDiffInMinutes(a: Moment, b: Moment) {
  return Math.abs(a.diff(b, "minutes"));
}

export function minutesToMoment(minutesSinceMidnight: number) {
  return moment().startOf("day").add(minutesSinceMidnight, "minutes");
}

export function addMinutes(moment: Moment, minutes: number) {
  return moment.clone().add(minutes, "minutes");
}

export function getRelationToNow(
  now: Moment,
  startMinutes: number,
  durationMinutes: number,
): RelationToNow {
  const endMinutes = startMinutes + durationMinutes;
  const start = minutesToMoment(startMinutes);
  const end = minutesToMoment(endMinutes);

  if (end.isBefore(now)) {
    return "past";
  }

  if (start.isAfter(now)) {
    return "future";
  }

  return "present";
}
