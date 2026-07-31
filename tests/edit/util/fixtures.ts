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
export const baseTimeBlock: WithPlacing<WithDuration<EditableTimeBlock>> = {
  source: "dailyNoteDate",
  symbol: "-",
  status: " ",
  startTime: baseTimeBlockStartTime,
  durationMinutes: 60,
  text: "text",
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
  id: "id",
};

export const unscheduledTimeBlock: EditableTimeBlock = {
  ...baseTimeBlock,
  isAllDayEvent: true,
};

export const threeTimeBlocks: [
  WithPlacing<WithDuration<EditableTimeBlock>>,
  WithPlacing<WithDuration<EditableTimeBlock>>,
  WithPlacing<WithDuration<EditableTimeBlock>>,
] = [
  {
    ...baseTimeBlock,
    id: "1",
    startTime: moment("2023-01-01 01:00"),
  },
  {
    ...baseTimeBlock,
    id: "2",
    startTime: moment("2023-01-01 02:00"),
  },
  {
    ...baseTimeBlock,
    id: "3",
    startTime: moment("2023-01-01 03:00"),
  },
];

export const threeTimeBlocksOverTwoDays: WithDuration<EditableTimeBlock>[] = [
  baseTimeBlock,
  { ...baseTimeBlock, id: "2", startTime: moment("2023-01-01 01:00") },
  { ...baseTimeBlock, id: "3", startTime: moment("2023-01-02 02:00") },
];

export const baseTimeBlocks: [WithPlacing<WithDuration<EditableTimeBlock>>] = [
  baseTimeBlock,
];

export const timeBlocksWithUnscheduledTimeBlock: [EditableTimeBlock] = [
  unscheduledTimeBlock,
];
