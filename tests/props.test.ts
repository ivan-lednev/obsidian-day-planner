import { afterEach, describe, expect, test, vi } from "vitest";

import {
  startActivityLog,
  cancelOpenClockByActivityIndex,
  clockOut,
  toMarkdown,
} from "../src/util/props";

vi.mock("obsidian", async () => {
  const yaml = await import("js-yaml");

  return {
    stringifyYaml: yaml.dump,
    parseYaml: yaml.load,
  };
});

afterEach(() => {
  vi.useRealTimers();
});

describe("clockOut", () => {
  test("appends finish modal notes to existing activity notes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));

    const result = clockOut(
      {
        activities: [
          {
            activity: "work",
            notes: "Already had notes",
            log: [{ start: "2026-01-01T10:00:00Z" }],
          },
        ],
      },
      0,
      { notes: "Added on clock out" },
    );

    expect(result.activities?.[0].notes).toBe(
      "Already had notes\nAdded on clock out",
    );
  });
});

describe("startActivityLog", () => {
  test("creates a new activity when another activity references the same task", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));

    const result = startActivityLog(
      {
        activities: [
          {
            activity: "task",
            taskIds: ["shared-task"],
            log: [
              {
                start: "2026-01-01T10:00:00Z",
                end: "2026-01-01T11:00:00Z",
              },
            ],
          },
        ],
      },
      "task",
      { taskIds: ["shared-task"] },
    );

    expect(result.activities).toHaveLength(2);
    expect(result.activities?.[0].log).toEqual([
      {
        start: "2026-01-01T10:00:00Z",
        end: "2026-01-01T11:00:00Z",
      },
    ]);
    expect(result.activities?.[1]).toMatchObject({
      activity: "task",
      taskIds: ["shared-task"],
    });
  });
});

describe("toMarkdown", () => {
  test("preserves optional task id metadata, including empty arrays", () => {
    const result = toMarkdown({
      activities: [
        {
          activity: "work",
          taskIds: [],
          log: [{ start: "2026-01-01T10:00:00Z" }],
        },
        {
          activity: "task",
          taskIds: ["task-123"],
          log: [{ start: "2026-01-01T11:00:00Z" }],
        },
      ],
    });

    expect(result).toContain("taskIds: []");
    expect(result).toContain("taskIds:");
    expect(result).toContain("- task-123");
  });
});

describe("cancelOpenClockByActivityIndex", () => {
  test("removes the activity when its sole log is unfinished", () => {
    const result = cancelOpenClockByActivityIndex(
      {
        activities: [
          {
            activity: "work",
            log: [{ start: "2026-01-01T10:00:00Z" }],
          },
        ],
      },
      0,
    );
    expect(result.activities).toEqual([]);
  });

  test("preserves completed clocks and activity details", () => {
    const completed = {
      start: "2026-01-01T10:00:00Z",
      end: "2026-01-01T11:00:00Z",
    };
    const result = cancelOpenClockByActivityIndex(
      {
        activities: [
          {
            activity: "reading",
            notes: "Keep me",
            log: [completed, { start: "2026-01-01T12:00:00Z" }],
          },
        ],
      },
      0,
    );
    expect(result.activities?.[0]).toMatchObject({
      notes: "Keep me",
      log: [completed],
    });
  });

  test("does not cancel a completed clock", () => {
    expect(() =>
      cancelOpenClockByActivityIndex(
        {
          activities: [
            {
              activity: "work",
              log: [
                { start: "2026-01-01T10:00:00Z", end: "2026-01-01T11:00:00Z" },
              ],
            },
          ],
        },
        0,
      ),
    ).toThrow("There is no open clock");
  });

  test("removes an activity when canceling its only clock", () => {
    const result = cancelOpenClockByActivityIndex(
      {
        activities: [
          {
            activity: "work",
            taskIds: [],
            log: [
              { start: "2026-01-01T10:00:00Z", end: "2026-01-01T11:00:00Z" },
            ],
          },
          {
            activity: "focus",
            taskIds: [],
            log: [{ start: "2026-01-01T12:00:00Z" }],
          },
        ],
      },
      1,
    );

    expect(result.activities).toHaveLength(1);
    expect(result.activities?.[0].activity).toBe("work");
  });
});
