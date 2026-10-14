import { z } from "zod";

import {
  type ActivityAttributeField,
  type ActivityAttributesDefinition,
  getActivityDefinitions,
} from "./activity-definitions";
import { multipleOpenClocksMessage } from "./activity-open-clock";
import { parseActivityTimestamp } from "./activity-time";

const dateTimeSchema = z
  .string()
  .refine((value) => parseActivityTimestamp(value).isValid());

const logEntrySchema = z.object({
  start: dateTimeSchema,
  end: dateTimeSchema.optional(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

const activityFieldSchemas = {
  text: () => z.string(),
  textarea: () => z.string(),
  number: () => z.number(),
} satisfies Record<ActivityAttributeField["type"], () => z.ZodTypeAny>;

function buildActivityFieldSchema(field: ActivityAttributeField) {
  return activityFieldSchemas[field.type]().optional();
}

function buildActivityAttributeSchema(
  attributes: ActivityAttributesDefinition,
) {
  const fields = [...attributes.start, ...attributes.end];
  const shape = Object.fromEntries(
    fields.map((field) => [field.key, buildActivityFieldSchema(field)]),
  );

  return z.object(shape).optional();
}

const activityAttributeSchemas = getActivityDefinitions().reduce<
  Record<string, z.ZodTypeAny>
>((accumulator, definition) => {
  if (!definition.attributes) {
    return accumulator;
  }

  return {
    ...accumulator,
    [definition.attributes.key]: buildActivityAttributeSchema(
      definition.attributes,
    ),
  };
}, {});

export const activitySchema = z
  .object({
    activity: z.string(),
    log: z
      .array(logEntrySchema)
      .refine(
        (logs) => logs.filter((log) => log.end === undefined).length <= 1,
        { message: multipleOpenClocksMessage },
      )
      .optional(),
    taskIds: z.array(z.string()).optional(),
    notes: z.string().optional(),
    quality: z.number().optional(),
    details: z.record(z.string(), z.unknown()).optional(),
    ...activityAttributeSchemas,
  })
  .passthrough()
  .refine((activity) => Boolean(activity.log?.length), {
    message: "Activities must contain at least one log entry with a start time",
    path: ["log"],
  });

export type Activity = z.infer<typeof activitySchema>;

const activitiesSchema = z.array(activitySchema);

export const propsSchema = z.looseObject({
  activities: activitiesSchema.optional(),
});

export type ParsedProps = z.infer<typeof propsSchema>;
export type Props = z.input<typeof propsSchema>;

export function normalizeActivities(parsedYaml: unknown): Props {
  if (Array.isArray(parsedYaml)) {
    return {
      activities: parsedYaml as NonNullable<Props["activities"]>,
    };
  }

  if (parsedYaml && typeof parsedYaml === "object") {
    const asRecord = parsedYaml as Record<string, unknown>;
    const planner = asRecord.planner as
      | { activities?: Props["activities"]; log?: LogEntry[] }
      | undefined;

    if (planner) {
      const activities =
        planner.activities && Array.isArray(planner.activities)
          ? (planner.activities as NonNullable<Props["activities"]>)
          : [];

      if (planner.log?.length) {
        const [firstActivity] =
          activities.length > 0
            ? activities
            : [{ activity: "Activity", log: [] }];

        const restActivities = activities.slice(1);

        return {
          activities: [
            {
              ...firstActivity,
              log: [...(firstActivity.log ?? []), ...planner.log],
            },
            ...restActivities,
          ],
        };
      }

      return { activities };
    }
  }

  return (parsedYaml ?? {}) as Props;
}
