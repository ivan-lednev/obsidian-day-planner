import {
  activityNotesField,
  buildActivityAttributeUpdate,
  getActivityAttributeFields,
  qualityRatingField,
  type ActivityAttributeField,
} from "./activity-definitions";
import { getOpenActivityLog } from "./activity-open-clock";
import type { Activity } from "./activity-schema";
import { formatActivityTimestamp } from "./activity-time";

export {
  getOpenActivityLog,
  hasOpenActivityClock,
} from "./activity-open-clock";

export type ActivityValues = Record<string, string | number | undefined>;

export function getActivityFinishFields(activityName: string) {
  return [
    ...getActivityAttributeFields(activityName, "end"),
    qualityRatingField,
    activityNotesField,
  ];
}

// Both clients use the same validation messages and optional-value semantics.
export function parseActivityValues(
  fields: ActivityAttributeField[],
  rawValues: Record<string, string>,
): ActivityValues {
  const values: ActivityValues = {};
  for (const field of fields) {
    const rawValue = (rawValues[field.key] ?? "").trim();
    if (!rawValue) {
      if (field.required) throw new Error(`${field.label} is required.`);
      values[field.key] = undefined;
      continue;
    }
    if (field.type !== "number") {
      values[field.key] = rawValue;
      continue;
    }
    const value = Number(rawValue);
    if (Number.isNaN(value))
      throw new Error(`${field.label} must be a number.`);
    if (typeof field.min === "number" && value < field.min)
      throw new Error(`${field.label} must be at least ${field.min}.`);
    if (typeof field.max === "number" && value > field.max)
      throw new Error(`${field.label} must be at most ${field.max}.`);
    values[field.key] = value;
  }
  return values;
}

export function buildActivityFinishUpdate(
  activityName: string,
  values: ActivityValues,
) {
  const { quality, notes, ...attributes } = values;
  return {
    ...buildActivityAttributeUpdate(activityName, attributes),
    ...(typeof quality === "number" ? { quality } : {}),
    ...(typeof notes === "string" ? { notes } : {}),
  };
}

export function getInitialActivityValues(
  fields: ActivityAttributeField[],
  initialValues: ActivityValues = {},
): Record<string, string> {
  return Object.fromEntries(
    fields.map(({ key }) => [key, String(initialValues[key] ?? "")]),
  );
}

export function hasActivityFormChanges(
  initialValues: Record<string, string>,
  values: Record<string, string>,
) {
  return Object.keys(initialValues).some(
    (key) => values[key] !== initialValues[key],
  );
}

export function createActivityRecordWithAttributes(
  activityName: string,
  attributes?: Record<string, unknown>,
  startedAt: number | string = Date.now(),
): Activity {
  return mergeActivityDetails(
    {
      activity: activityName,
      log: [{ start: formatActivityTimestamp(startedAt) }],
    },
    attributes,
  );
}

export function createActivityRecord(
  activityName: string,
  values: ActivityValues,
  startedAt: number | string = Date.now(),
): Activity {
  return createActivityRecordWithAttributes(
    activityName.trim(),
    buildActivityAttributeUpdate(activityName, values),
    startedAt,
  );
}

export function closeActivityRecord(
  activity: Activity,
  attributes?: Record<string, unknown>,
  endedAt: number | string = Date.now(),
): Activity {
  getOpenActivityLog(activity);
  const log = activity.log;
  if (!log) throw new Error("There is no log");
  const index = log.findIndex((entry) => !entry.end);
  return closeActivityLogEntry(activity, index, attributes, endedAt);
}

export function closeActivityLogEntry(
  activity: Activity,
  logEntryIndex: number,
  attributes?: Record<string, unknown>,
  endedAt: number | string = Date.now(),
): Activity {
  getOpenActivityLog(activity);
  const log = activity.log;
  if (!log?.[logEntryIndex] || log[logEntryIndex].end)
    throw new Error("There is no open clock");
  return mergeActivityDetails(
    {
      ...activity,
      log: log.map((entry, entryIndex) =>
        entryIndex === logEntryIndex
          ? { ...entry, end: formatActivityTimestamp(endedAt) }
          : entry,
      ),
    },
    attributes,
  );
}

export function finishActivityRecord(
  activity: Activity,
  values: ActivityValues,
  endedAt: number | string = Date.now(),
  expectedStart?: string,
): Activity {
  getOpenActivityLog(activity, expectedStart);
  return closeActivityRecord(
    activity,
    buildActivityFinishUpdate(activity.activity, values),
    endedAt,
  );
}

export function mergeActivityDetails(
  activity: Activity,
  updates?: Record<string, unknown>,
): Activity {
  getOpenActivityLog(activity);
  if (!updates) {
    return activity;
  }

  const updated = Object.entries(updates).reduce<Activity>(
    (result, [key, value]) => {
      if (key === "notes" && typeof value === "string") {
        const trimmedValue = value.trim();

        if (!trimmedValue) {
          return result;
        }

        return {
          ...result,
          notes:
            typeof result.notes === "string" && result.notes.length > 0
              ? `${result.notes}
${trimmedValue}`
              : trimmedValue,
        };
      }

      if (value && typeof value === "object" && !Array.isArray(value)) {
        const existing = (result as Record<string, unknown>)[key];
        if (
          existing &&
          typeof existing === "object" &&
          !Array.isArray(existing)
        ) {
          return {
            ...result,
            [key]: {
              ...(existing as Record<string, unknown>),
              ...(value as Record<string, unknown>),
            },
          };
        }
      }

      return {
        ...result,
        [key]: value,
      };
    },
    activity,
  );
  getOpenActivityLog(updated);
  return updated;
}
