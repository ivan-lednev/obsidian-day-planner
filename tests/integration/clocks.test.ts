import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import { setUp } from "./init-test-system";

describe("Clocks", () => {
  test("Reads log data", async () => {
    const { getDisplayedTasksWithClocksForTimeline } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTasks = getDisplayedTasksWithClocksForTimeline(
      window.moment("2025-07-19"),
    );

    expect(get(displayedTasks)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          startTime: window.moment("2025-07-19 12:00"),
          durationMinutes: 150,
        }),
        expect.objectContaining({
          startTime: window.moment("2025-07-19 15:00"),
          durationMinutes: 90,
        }),
        expect.objectContaining({
          startTime: window.moment("2025-07-19 13:00"),
          durationMinutes: 210,
        }),
      ]),
    );
  });

  test.todo("Only reads props under tasks");

  test.todo("Ignores invalid dates, extra keys");

  test("Tasks with active clocks receive durations set to current time", async () => {
    const {
      getDisplayedTasksWithClocksForTimeline,
      currentTime,
      tasksWithActiveClockProps,
    } = await setUp({
      visibleDays: ["2025-01-11"],
    });

    currentTime.set(window.moment("2025-01-01 17:30"));

    const displayedClocks = getDisplayedTasksWithClocksForTimeline(
      window.moment("2025-01-01"),
    );

    expect(get(displayedClocks)).toMatchObject([
      {
        startTime: window.moment("2025-01-01 17:00"),
        durationMinutes: 30,
      },
      {
        startTime: window.moment("2025-01-01 13:00"),
        durationMinutes: 120,
      },
    ]);

    expect(get(tasksWithActiveClockProps)).toMatchObject([
      {
        startTime: window.moment("2025-01-01 17:00"),
        durationMinutes: 30,
      },
    ]);
  });

  test.todo("Splits log entries over midnight");

  test.todo("Parses code blocks under nested tasks");

  describe("Clocking in", () => {
    test.todo("Clocks in on tasks");

    test.todo("Does not clock in on tasks with active clocks");

    test.todo("Does not mess up other child blocks in list");

    test.todo(
      "For a single line in a file, adds a newline instead of appending the code block to the line",
    );
  });

  describe("Clocking out", () => {
    test.todo("Clocks out on tasks");

    test.todo("Does not clock out on tasks without a clock");
  });

  describe("Canceling clocks", () => {
    test.todo("Cancels clocks");

    test.todo("Does not touch a file without an active clock");
  });
});
