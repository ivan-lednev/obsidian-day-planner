import type { Moment } from "moment/moment";

import { timeRegExp } from "../regexp";

export function parseTime(asText: string, day: Moment) {
  const match = asText.match(timeRegExp);

  if (match === null) {
    throw new Error(`${asText} is not a valid timestamp`);
  }

  const [, hours12h, minutes12h, ampm, hours24h, minutes24h] = match;

  const hours = hours12h ?? hours24h;
  const minutes = minutes12h ?? minutes24h;

  let parsedHours = parseInt(hours);

  if (Number.isNaN(parsedHours)) {
    throw new Error(`${asText} is not a valid timestamp`);
  }

  const parsedMinutes = parseInt(minutes) || 0;

  const ampmNormalized = ampm?.toLowerCase().trim();

  if (ampmNormalized === "pm") {
    parsedHours += 12;
  } else if (ampmNormalized === "am" && parsedHours === 12) {
    parsedHours = 0;
  }

  const timeOfDay = window.moment.duration({
    hours: parsedHours,
    minutes: parsedMinutes,
  });

  return day.clone().startOf("day").add(timeOfDay);
}
