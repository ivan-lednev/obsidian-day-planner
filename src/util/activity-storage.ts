import type { Moment } from "moment";

import type { ActivityResourceMetadata } from "./activity-field-options";
import {
  normalizeActivities,
  activitySchema,
  propsSchema,
  type Activity,
} from "./activity-schema";
import { parseActivityTimestamp } from "./activity-time";

export const plannerFolder = "_Planner";
export const activitiesFolder = `${plannerFolder}/activities`;
export const goalsFolder = `${plannerFolder}/goals`;

export interface ActivityYamlCodec {
  parse: (contents: string) => unknown;
  stringify: (data: unknown) => string;
}

export function activityWeekKey(date: Moment) {
  return `${date.isoWeekYear()}-W${String(date.isoWeek()).padStart(2, "0")}`;
}

export function weeklyPlannerPath(folder: string, date: Moment) {
  return `${folder}/${date.isoWeekYear()}/${activityWeekKey(date)}.yaml`;
}

export function activitiesPathFor(date: Moment) {
  return weeklyPlannerPath(activitiesFolder, date);
}

export function goalsPathFor(date: Moment) {
  return weeklyPlannerPath(goalsFolder, date);
}

export function getActivityStart(
  activity: Activity,
  parseTimestamp: (timestamp: string) => Moment = parseActivityTimestamp,
) {
  const starts = (activity.log ?? []).map(({ start }) => parseTimestamp(start));
  if (!starts.length || starts.some((start) => !start.isValid()))
    throw new Error(`Activity "${activity.activity}" has no valid start time`);
  return starts.reduce((earliest, start) =>
    start.isBefore(earliest) ? start : earliest,
  );
}

export function readActivityFile(
  contents: string,
  codec: ActivityYamlCodec,
): Activity[] {
  return (
    propsSchema.parse(normalizeActivities(codec.parse(contents))).activities ??
    []
  );
}

export function writeActivityFile(
  activities: Activity[],
  codec: ActivityYamlCodec,
) {
  return codec.stringify({
    activities: activities.map((activity) => activitySchema.parse(activity)),
  });
}

export function groupActivitiesByWeek(activities: Activity[]) {
  const groups = new Map<string, Activity[]>();
  for (const activity of activities) {
    const path = activitiesPathFor(getActivityStart(activity));
    groups.set(path, [...(groups.get(path) ?? []), activity]);
  }
  return [...groups].map(([path, records]) => ({
    path,
    filename: path.split("/").at(-1)!,
    activities: records,
  }));
}

export function createActivityWeekFiles(
  activities: Activity[],
  codec: ActivityYamlCodec,
) {
  return groupActivitiesByWeek(activities).map(
    ({ path, filename, activities: records }) => ({
      path,
      filename,
      contents: writeActivityFile(records, codec),
    }),
  );
}

export function readResourceFile(
  filename: string,
  contents: string,
  codec: ActivityYamlCodec,
): ActivityResourceMetadata {
  const frontmatterMatch = contents.match(
    /^\uFEFF?---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/,
  );
  const parsed = frontmatterMatch ? codec.parse(frontmatterMatch[1]) : {};
  const frontmatter =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  const body = contents
    .slice(frontmatterMatch?.[0].length ?? 0)
    .replace(/^(?:`{3,}|~{3,})[^\n]*\n[\s\S]*?^(?:`{3,}|~{3,})[^\n]*$/gm, "")
    .replace(/`[^`]*`/g, "");
  const tags = [...body.matchAll(/(?:^|\s)#([\p{L}\p{N}_/-]+)/gu)].map(
    (match) => match[1],
  );
  return { name: filename.replace(/\.md$/i, ""), frontmatter, tags };
}
