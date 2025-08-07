import { takeWhile } from "lodash/fp";
import { stringifyYaml } from "obsidian";
import { z } from "zod";

import { clockFormat, codeFence } from "../constants";
import {
  keylessScheduledPropRegExp,
  propRegexp,
  scheduledPropRegExp,
  shortScheduledPropRegExp,
} from "../regexp";

import { getIndentationForListParagraph } from "./dataview";
import { createCodeBlock, createIndentation, indent } from "./markdown";
import { appendText } from "./task-utils";

const dateTimeSchema = z
  .string()
  .refine((it) => window.moment(it, window.moment.ISO_8601, true).isValid());

const logEntrySchema = z.object({
  start: dateTimeSchema,
  end: dateTimeSchema.optional(),
});

export type LogEntry = z.infer<typeof logEntrySchema>;

const plannerSchema = z.object({
  log: z.array(logEntrySchema).optional(),
});

export const propsSchema = z.looseObject({
  planner: plannerSchema.optional(),
});

export type Props = z.infer<typeof propsSchema>;

export function isWithOpenClock(props?: Props) {
  return Boolean(props?.planner?.log?.find((it) => !it.end));
}

export function createPropsWithOpenClock(): Props {
  return {
    planner: {
      log: [
        {
          start: window.moment().format(clockFormat),
        },
      ],
    },
  };
}

export function addOpenClock(props: Props): Props {
  if (isWithOpenClock(props)) {
    throw new Error("There is already an open clock");
  }

  return {
    ...props,
    planner: {
      ...props.planner,
      log: [
        ...(props.planner?.log || []),
        {
          start: window.moment().format(clockFormat),
        },
      ],
    },
  };
}

export function cancelOpenClock(props: Props): Props {
  if (!props.planner?.log) {
    throw new Error("There is no log");
  }

  const openClockIndex = props.planner.log.findIndex((it) => !it.end);

  if (openClockIndex === -1) {
    throw new Error("There is no open clock");
  }

  return {
    ...props,
    planner: {
      ...props.planner,
      log: props.planner.log.toSpliced(openClockIndex, 1),
    },
  };
}

export function clockOut(props: Props): Props {
  if (!props.planner?.log) {
    throw new Error("There is no log under cursor");
  }

  const openClockIndex = props.planner.log.findIndex((it) => !it.end);

  if (openClockIndex === -1) {
    throw new Error("There is no open clock");
  }

  const updatedOpenClock = {
    ...props.planner.log[openClockIndex],
    end: window.moment().format(clockFormat),
  };

  return {
    ...props,
    planner: {
      ...props.planner,
      log: props.planner.log.with(openClockIndex, updatedOpenClock),
    },
  };
}

export function toMarkdown(props: Props) {
  return createCodeBlock({ language: "yaml", text: stringifyYaml(props) });
}

export function createProp(
  key: string,
  value: string,
  type: "default" | "keyless" = "default",
) {
  if (type === "default") {
    return `[${key}::${value}]`;
  }

  return `(${key}::${value})`;
}

export function updateProp(
  line: string,
  updateFn: (previous: string) => string,
) {
  const match = [...line.matchAll(propRegexp)];

  if (match.length === 0) {
    throw new Error(`Did not find a prop in line: '${line}'`);
  }

  const captureGroups = match[0];
  const [, key, previousValue] = captureGroups;

  return `[${key}::${updateFn(previousValue)}]`;
}

export function deleteProps(text: string) {
  return takeWhile(
    (line) => !line.trimStart().startsWith(codeFence),
    text.split("\n"),
  )
    .join("\n")
    .replaceAll(propRegexp, "")
    .trim();
}

export function updateScheduledPropInText(text: string, dayKey: string) {
  return text
    .replace(shortScheduledPropRegExp, `$1${dayKey}`)
    .replace(scheduledPropRegExp, `$1${dayKey}$2`)
    .replace(keylessScheduledPropRegExp, `$1${dayKey}$2`);
}

export function addTasksPluginProp(text: string, prop: string) {
  return appendText(text, ` ${prop}`);
}

export function toIndentedMarkdown(props: Props, column: number) {
  const asMarkdown = toMarkdown(props);
  const indentation =
    createIndentation(column) + getIndentationForListParagraph();

  return indent(asMarkdown, indentation);
}
