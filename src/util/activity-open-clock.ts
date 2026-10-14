import type { LogEntry } from "./activity-schema";

export const multipleOpenClocksMessage =
  "An activity can have at most one open clock";

export function getOpenActivityLog(
  activity: { log?: LogEntry[] },
  expectedStart?: string,
) {
  const open = (activity.log ?? []).filter((entry) => entry.end === undefined);
  if (open.length > 1) throw new Error(multipleOpenClocksMessage);
  const log = open[0];
  if (expectedStart !== undefined && log?.start !== expectedStart)
    throw new Error(
      "That clock changed or is no longer open. Reopen the finish form.",
    );
  return log;
}

export function hasOpenActivityClock(activity: { log?: LogEntry[] }) {
  return getOpenActivityLog(activity) !== undefined;
}
