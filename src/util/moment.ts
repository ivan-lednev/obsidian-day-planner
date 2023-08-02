import type { Moment } from "moment/moment";

const moment = window.moment;

export function getMinutesSinceMidnight() {
  return moment().diff(moment().startOf("day"), "minutes");
}

// TODO: accept moment
export function getMinutesSinceMidnightTo(date: Date) {
  return getDiffInMinutes(moment(date), moment().startOf("day"));
}

export function getDiffInMinutes(a: Moment, b: Moment) {
  return a.diff(b, "minutes");
}
