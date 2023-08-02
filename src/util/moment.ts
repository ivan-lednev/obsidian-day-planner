const moment = window.moment;

export function getMinutesSinceMidnight() {
  return moment().diff(moment().startOf("day"), "minutes");
}

export function getMinutesSinceMidnightTo(date: Date) {
  return moment(date).diff(moment().startOf("day"), "minutes");
}
