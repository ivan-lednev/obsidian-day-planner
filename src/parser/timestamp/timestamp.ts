import type { Moment } from "moment/moment";

import { timeRegExp } from "../../regexp";

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

  if (ampm?.toLowerCase() === "pm" && parsedHours < 12) {
    parsedHours += 12;
  }

  const timeOfDay = window.moment.duration({
    hours: parsedHours,
    minutes: parsedMinutes,
  });

  return day.clone().startOf("day").add(timeOfDay);
}
