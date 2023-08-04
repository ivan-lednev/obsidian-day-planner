import { timeRegExp } from "../regexp";
import type { Moment } from "moment/moment";

export function parseTimestamp(asText?: string): Moment | null {
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

  return window.moment({ hours: parsedHours, minutes: parsedMinutes });
}
