import type { Moment } from "moment";
import moment from "moment";

import type {
  EditableTimeBlock,
  WithPlacing,
  WithDuration,
} from "../../../src/time-block-types";

export const dayKey = "2023-01-01";
export const day = moment(dayKey);
export const nextDayKey = "2023-01-02";
export const nextDay = moment(nextDayKey);

export const emptyTimeBlocks = [];
export const baseTimeBlockStartTime = moment("2023-01-01 00:00");

const timeBlockDefaults = {
  source: "dailyNoteDate" as const,
  symbol: "-",
  status: " ",
  startTime: baseTimeBlockStartTime,
  durationMinutes: 60,
  placing: {
    offsetPercent: 0,
    spanPercent: 100,
  },
  path: "path",
  position: {
    start: {
      line: 0,
      col: 0,
      offset: 0,
    },
    end: {
      line: 0,
      col: 0,
      offset: 0,
    },
  },
};

/**
 * Text is derived from the id so that no two blocks share a render key: it is
 * built from time, path, line and text, and blocks that collide on it get
 * deduped before they reach a column.
 */
export function createTimeBlock(
  id: string,
  overrides: Partial<{
    startTime: Moment;
    durationMinutes: number;
    isAllDayEvent: boolean;
    text: string;
  }> = {},
): WithPlacing<WithDuration<EditableTimeBlock>> {
  return {
    ...timeBlockDefaults,
    id,
    text: `text ${id}`,
    ...overrides,
  };
}

export const baseTimeBlock = createTimeBlock("id");

export const unscheduledTimeBlock: EditableTimeBlock = createTimeBlock("id", {
  isAllDayEvent: true,
});

export const threeTimeBlocks: [
  WithPlacing<WithDuration<EditableTimeBlock>>,
  WithPlacing<WithDuration<EditableTimeBlock>>,
  WithPlacing<WithDuration<EditableTimeBlock>>,
] = [
  createTimeBlock("1", { startTime: moment("2023-01-01 01:00") }),
  createTimeBlock("2", { startTime: moment("2023-01-01 02:00") }),
  createTimeBlock("3", { startTime: moment("2023-01-01 03:00") }),
];

export const threeTimeBlocksOverTwoDays: WithDuration<EditableTimeBlock>[] = [
  baseTimeBlock,
  createTimeBlock("2", { startTime: moment("2023-01-01 01:00") }),
  createTimeBlock("3", { startTime: moment("2023-01-02 02:00") }),
];

export const baseTimeBlocks: [WithPlacing<WithDuration<EditableTimeBlock>>] = [
  baseTimeBlock,
];

export const timeBlocksWithUnscheduledTimeBlock: [EditableTimeBlock] = [
  unscheduledTimeBlock,
];
