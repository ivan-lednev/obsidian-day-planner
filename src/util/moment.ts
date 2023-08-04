import type { Moment } from "moment/moment";

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
