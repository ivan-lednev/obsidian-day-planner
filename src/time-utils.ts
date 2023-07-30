const moment = window.moment;

export function getMinutesSinceMidnight() {
  return moment().diff(moment().startOf("day"), "minutes");
}
