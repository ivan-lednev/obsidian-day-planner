import { STask } from "obsidian-dataview";

import {
  sTaskLineToString,
  sTaskToString,
} from "../../service/dataview-facade";
import { clockToTime, parseClock } from "../../util/clock";
import { getId } from "../../util/id";

export function sTaskToClocks(sTask: STask, rawClock: string | []) {
  if (Array.isArray(rawClock)) {
    return rawClock.map((clock: string) => sTaskToClocks(sTask, clock));
  }

  const parsedClock = parseClock(rawClock);

  if (!parsedClock) {
    return null;
  }

  // todo: use factory
  return {
    ...clockToTime(parsedClock),
    startTime: parsedClock.start,
    firstLineText: sTaskLineToString(sTask),
    text: sTaskToString(sTask),
    location: {
      path: sTask.path,
      line: sTask.line,
      position: sTask.position,
    },
    id: getId(),
  };
}
