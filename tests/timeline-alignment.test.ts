import moment from "moment";
import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import { momentToTimelineOffset } from "../src/global-store/derived-settings";
import { settingsStore } from "../src/global-store/settings";
import { logEntryToTimeBlock } from "../src/redux/index/entry-to-time-block";
import type { ListItemEntry, LogEntry } from "../src/redux/index/index-slice";
import { useTimeBlockVisuals } from "../src/ui/hooks/use-time-block-visuals";

import { baseTimeBlock } from "./edit/util/fixtures";

const emptyPoint = { line: 0, col: 0, offset: 0 };

const parentEntry: ListItemEntry = {
  id: "parent-id",
  text: "Task",
  path: "file.md",
  symbol: "-",
  task: " ",
  position: { start: emptyPoint, end: emptyPoint },
};

function toTimeBlock(logEntry: LogEntry, currentTime: moment.Moment) {
  return logEntryToTimeBlock({ logEntry, parentEntry, currentTime });
}

function getLogEntryTimes(logEntry: LogEntry, currentTime: moment.Moment) {
  const { startTime, durationMinutes } = toTimeBlock(logEntry, currentTime);

  return { startTime, durationMinutes };
}

const baseLogEntry: LogEntry = {
  id: "id",
  parentId: "parent-id",
  start: "2025-01-01 09:00:00",
  dayKeys: ["2025-01-01"],
  source: "listItemLog",
};

function getBottomOffset(times: {
  startTime: moment.Moment;
  durationMinutes: number;
}) {
  const { offset, height } = useTimeBlockVisuals(
    { ...baseTimeBlock, ...times },
    { settingsStore },
  );

  return parseFloat(get(offset)) + parseFloat(get(height));
}

describe("Blocks on the timeline", () => {
  test.each(["09:12:00", "09:12:01", "09:12:47", "09:12:59"])(
    "An open clock started at %s ends exactly where the needle is",
    (startTime) => {
      const currentTime = moment("2025-01-01 13:37:05");
      const times = getLogEntryTimes(
        { ...baseLogEntry, start: `2025-01-01 ${startTime}` },
        currentTime,
      );

      expect(getBottomOffset(times)).toBe(
        momentToTimelineOffset(currentTime, get(settingsStore)),
      );
    },
  );

  test("A closed clock lasts as long as the distance between its own edges", () => {
    const times = getLogEntryTimes(
      {
        ...baseLogEntry,
        start: "2025-01-01 09:00:50",
        end: "2025-01-01 09:30:10",
      },
      moment("2025-01-01 13:37:05"),
    );

    expect(times.durationMinutes).toBe(30);
  });

  test("A clock shorter than a minute takes up no space", () => {
    const times = getLogEntryTimes(
      {
        ...baseLogEntry,
        start: "2025-01-01 09:00:10",
        end: "2025-01-01 09:00:50",
      },
      moment("2025-01-01 13:37:05"),
    );

    expect(times.durationMinutes).toBe(0);
  });

  test("Only a clock without an end of its own is marked as running", () => {
    const currentTime = moment("2025-01-01 13:37:05");

    expect(toTimeBlock(baseLogEntry, currentTime).isRunning).toBe(true);
    expect(
      toTimeBlock({ ...baseLogEntry, end: "2025-01-01 09:30:00" }, currentTime)
        .isRunning,
    ).toBe(false);
  });

  test("An open clock started on a previous day keeps growing", () => {
    const currentTime = moment("2025-01-01 13:37:05");
    const times = getLogEntryTimes(
      { ...baseLogEntry, start: "2024-12-31 23:00:00" },
      currentTime,
    );

    expect(times.durationMinutes).toBe(14 * 60 + 37);
  });
});
