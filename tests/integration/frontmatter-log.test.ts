import { describe, expect, test, vi } from "vitest";

import {
  selectLogEntriesForDay,
  selectRecentLogEntries,
} from "../../src/redux";
import {
  fileDeleted,
  selectActiveLogEntries,
} from "../../src/redux/index/index-slice";
import { strictParse } from "../../src/util/moment";

import { setUp } from "./util/setup";

const closedLogFixture = "frontmatter-1-closed-log-entry.md";
const closedLogPath = `fixtures/fixture-vault/${closedLogFixture}`;
const closedLogBasename = "frontmatter-1-closed-log-entry";

const openLogFixture = "frontmatter-1-open-log-entry.md";
const openLogBasename = "frontmatter-1-open-log-entry";

const dayKey = "2025-07-19";

describe("Frontmatter log indexing", () => {
  test("Indexes a closed frontmatter log entry on its day", async () => {
    const { getState } = await setUp({ loadedFixtures: [closedLogFixture] });

    expect(
      selectLogEntriesForDay(getState(), dayKey, strictParse(dayKey)),
    ).toContainEqual(
      expect.objectContaining({
        text: closedLogBasename,
        startTime: window.moment("2025-07-19 12:00"),
        durationMinutes: 150,
      }),
    );
  });

  test("Surfaces frontmatter logs among recent log entries", async () => {
    const { getState } = await setUp({ loadedFixtures: [closedLogFixture] });

    expect(selectRecentLogEntries(getState())).toContainEqual(
      expect.objectContaining({ text: closedLogBasename }),
    );
  });

  test("Surfaces an open frontmatter clock as an active log entry", async () => {
    const { getState } = await setUp({ loadedFixtures: [openLogFixture] });

    expect(selectActiveLogEntries(getState())).toContainEqual(
      expect.objectContaining({
        text: openLogBasename,
        startTime: window.moment("2025-07-19 12:00"),
      }),
    );
  });

  test("Removes frontmatter logs when the file is deleted", async () => {
    const { getState, dispatch } = await setUp({
      loadedFixtures: [closedLogFixture],
    });

    expect(
      selectLogEntriesForDay(getState(), dayKey, strictParse(dayKey)),
    ).toHaveLength(1);

    dispatch(fileDeleted({ path: closedLogPath }));

    expect(
      selectLogEntriesForDay(getState(), dayKey, strictParse(dayKey)),
    ).toEqual([]);
  });

  test.todo(
    "Replaces frontmatter logs on re-index without duplicates and removes deleted ones when entry count shrinks",
  );
});
