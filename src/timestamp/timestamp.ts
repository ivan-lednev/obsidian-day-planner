import { timeRegExp } from "../regexp";
import type { Moment } from "moment/moment";
import { addMinutes, minutesToMoment } from "../util/moment";
import type { Timestamp } from "src/store/timeline-store";
import type { PlanItem } from "../types";

export function parseTimestamp(asText?: string, day?: Moment): Moment | null {
  if (!asText) {
    return null;
  }

  const result = timeRegExp.exec(asText);

  if (result === null) {
    throw new Error(`${asText} is not a valid timestamp`);
  }

  const [, hours, minutes, ampm] = result;

  let parsedHours = parseInt(hours);

  if (isNaN(parsedHours)) {
    throw new Error(`${asText} is not a valid timestamp`);
  }

  const parsedMinutes = parseInt(minutes) || 0;

  // todo: what about 12?
  if (ampm?.toLowerCase() === "pm" && parsedHours < 12) {
    parsedHours += 12;
  }

  const timeOfDay = window.moment.duration({
    hours: parsedHours,
    minutes: parsedMinutes,
  });

  return day.clone().startOf("day").add(timeOfDay);
}

export function replaceTimestamp(
  planItem: PlanItem,
  { startMinutes, durationMinutes }: Timestamp,
) {
  return `${planItem.listTokens}${createTimestamp(
    startMinutes,
    durationMinutes,
  )} ${planItem.text}`;
}

function createTimestamp(startMinutes: number, durationMinutes: number) {
  const start = minutesToMoment(startMinutes);
  const end = addMinutes(start, durationMinutes);

  return `${formatTimestamp(start)} - ${formatTimestamp(end)}`;
}

function formatTimestamp(moment: Moment) {
  return moment.format("HH:mm");
}
