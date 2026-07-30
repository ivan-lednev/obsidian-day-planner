import { isNotVoid } from "typed-assert";

import { emDash } from "../constants";
import type { DayPlannerSettings } from "../settings";
import type { TimeBlock, WithDuration } from "../time-block-types";

import { getMinutesSinceMidnight } from "./moment";
import { createTimestamp, getOneLineSummary } from "./time-block-utils";

export function notifyAboutStartedTimeBlocks(
  timeBlocks: WithDuration<TimeBlock>[],
  settings: DayPlannerSettings,
) {
  if (typeof Notification === "undefined" || timeBlocks.length === 0) {
    return;
  }

  const firstTimeBlock = timeBlocks[0];

  isNotVoid(firstTimeBlock);

  const summary = getOneLineSummary(firstTimeBlock);
  const timestamp = createTimestamp(
    getMinutesSinceMidnight(firstTimeBlock.startTime),
    firstTimeBlock.durationMinutes,
    settings.timestampFormat,
    emDash,
  );

  new Notification(`Task started: ${summary}
${timestamp}`);
}
