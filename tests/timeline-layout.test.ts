import moment from "moment";
import { describe, expect, test } from "vitest";

import { layOutDayColumn } from "../src/timeline-layout";

import { createTimeBlock, day, nextDay } from "./edit/util/fixtures";

describe("layOutDayColumn", () => {
  // todo: it should not collapse them
  test("collapses blocks that would render identically", () => {
    // One list item can be indexed twice — from the daily note date and from
    // the tasks plugin prop — giving two entries with distinct ids.
    const fromDailyNote = createTimeBlock("daily-note-entry");
    const fromTasksPlugin = createTimeBlock("tasks-plugin-entry", {
      text: fromDailyNote.text,
    });

    expect(
      layOutDayColumn({ timeBlocks: [fromDailyNote, fromTasksPlugin], day }),
    ).toHaveLength(1);
  });

  test("keeps blocks that differ in time", () => {
    const first = createTimeBlock("1");
    const second = createTimeBlock("2", {
      text: first.text,
      startTime: moment("2023-01-01 05:00"),
    });

    expect(layOutDayColumn({ timeBlocks: [first, second], day })).toHaveLength(
      2,
    );
  });

  test("keeps blocks that differ in text", () => {
    expect(
      layOutDayColumn({
        timeBlocks: [createTimeBlock("1"), createTimeBlock("2")],
        day,
      }),
    ).toHaveLength(2);
  });

  test("clips a block crossing midnight to each day it touches and marks the cut edges", () => {
    const timeBlocks = [
      createTimeBlock("1", {
        startTime: moment("2023-01-01 23:00"),
        durationMinutes: 120,
      }),
    ];

    expect(layOutDayColumn({ timeBlocks, day })).toMatchObject([
      {
        startTime: moment("2023-01-01 23:00"),
        durationMinutes: 60,
        truncated: ["bottom"],
      },
    ]);
    expect(layOutDayColumn({ timeBlocks, day: nextDay })).toMatchObject([
      {
        startTime: moment("2023-01-02 00:00"),
        durationMinutes: 60,
        truncated: ["top"],
      },
    ]);
  });

  test("shows a block spanning multiple days in the middle days it covers", () => {
    const timeBlocks = [
      createTimeBlock("1", {
        startTime: moment("2023-01-01 23:00"),
        durationMinutes: 3 * 24 * 60,
      }),
    ];

    expect(layOutDayColumn({ timeBlocks, day: nextDay })).toMatchObject([
      {
        startTime: moment("2023-01-02 00:00"),
        durationMinutes: 24 * 60,
        truncated: ["top", "bottom"],
      },
    ]);
  });

  test("does not show a block ending exactly at midnight on the next day", () => {
    const timeBlocks = [
      createTimeBlock("1", {
        startTime: moment("2023-01-01 23:00"),
        durationMinutes: 60,
      }),
    ];

    const [onItsOwnDay] = layOutDayColumn({ timeBlocks, day });

    expect(onItsOwnDay).not.toHaveProperty("truncated");
    expect(layOutDayColumn({ timeBlocks, day: nextDay })).toEqual([]);
  });
});
