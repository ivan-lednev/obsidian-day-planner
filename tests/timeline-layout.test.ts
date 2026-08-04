import moment from "moment";
import { describe, expect, test } from "vitest";

import { layOutDayColumn } from "../src/timeline-layout";

import { createTimeBlock } from "./edit/util/fixtures";

describe("layOutDayColumn", () => {
  // todo: it should not collapse them
  test("collapses blocks that would render identically", () => {
    // One list item can be indexed twice — from the daily note date and from
    // the tasks plugin prop — giving two entries with distinct ids.
    const fromDailyNote = createTimeBlock("daily-note-entry");
    const fromTasksPlugin = createTimeBlock("tasks-plugin-entry", {
      text: fromDailyNote.text,
    });

    expect(layOutDayColumn([fromDailyNote, fromTasksPlugin])).toHaveLength(1);
  });

  test("keeps blocks that differ in time", () => {
    const first = createTimeBlock("1");
    const second = createTimeBlock("2", {
      text: first.text,
      startTime: moment("2023-01-01 05:00"),
    });

    expect(layOutDayColumn([first, second])).toHaveLength(2);
  });

  test("keeps blocks that differ in text", () => {
    expect(
      layOutDayColumn([createTimeBlock("1"), createTimeBlock("2")]),
    ).toHaveLength(2);
  });
});
