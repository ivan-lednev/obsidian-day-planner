import { Array } from "effect";
import type { Moment } from "moment";
import { match } from "ts-pattern";
import { isNotVoid } from "typed-assert";

import { defaultRangeDayFormat } from "../constants";
import type { DayPlannerSettings } from "../settings";

import { getMomentFromDayOfWeek } from "./moment";

export function createRange(
  type: DayPlannerSettings["multiDayRange"],
  firstDayOfWeek: DayPlannerSettings["firstDayOfWeek"],
) {
  const today = window.moment();
  return match(type)
    .with("full-week", () => getFullWeek(today, firstDayOfWeek))
    .with("3-days", () => getUpcomingDays(today, 3))
    .with("work-week", () => getWorkWeek(today))
    .exhaustive();
}

export function getFullWeek(
  moment: Moment,
  firstDay: DayPlannerSettings["firstDayOfWeek"],
) {
  const firstDayMoment = getMomentFromDayOfWeek(moment, firstDay);

  return Array.makeBy(7, (dayIndex) =>
    firstDayMoment.clone().add(dayIndex, "day"),
  );
}

export function getWorkWeek(day: Moment) {
  return getUpcomingDays(day.clone().startOf("isoWeek"), 5);
}

export function getUpcomingDays(start: Moment, count: number) {
  return Array.makeBy(count, (dayIndex) => start.clone().add(dayIndex, "day"));
}

export function getNextWorkWeek(day: Moment) {
  const firstDay = day.clone().startOf("isoWeek").add(7, "days");

  return getUpcomingDays(firstDay, 5);
}

export function getPreviousWorkWeek(day: Moment) {
  const firstDay = day.clone().startOf("isoWeek").subtract(7, "days");

  return getUpcomingDays(firstDay, 5);
}

export function getNextAdjacentRange(range: Moment[]) {
  return range.map((day) => day.clone().add(range.length, "days"));
}

export function getPreviousAdjacentRange(range: Moment[]) {
  return range.map((day) => day.clone().subtract(range.length, "days"));
}

export function toString(range: Moment[]) {
  const first = range[0];
  const last = range.at(-1);

  isNotVoid(first);
  isNotVoid(last);

  const start = first.format(defaultRangeDayFormat);
  const end = last.format(defaultRangeDayFormat);

  return `${start}–${end}`;
}
