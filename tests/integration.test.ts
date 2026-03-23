import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import { selectLogEntriesForDayKeys } from "../src/redux";
import {
  fileDeleted,
  metadataChanged,
  selectActiveClocks,
  selectEntriesForPath,
} from "../src/redux/tracker/tracker-slice";
import { defaultSettingsForTests } from "../src/settings";
import { EditMode } from "../src/ui/hooks/use-edit/types";

import { setUp } from "./integration/setup";
import { getPathToDiff } from "./test-utils";

describe("Log Records with indexes", () => {
  test("Stores text, path, position for task entries", async () => {
    const { getState } = await setUp();

    expect(
      selectEntriesForPath(
        getState(),
        "fixtures/fixture-vault/one-task-two-log-records.md",
      ),
    ).toMatchObject([
      {
        text: "- [ ] Task",
        position: {
          start: expect.any(Object),
          end: expect.any(Object),
        },
        path: "fixtures/fixture-vault/one-task-two-log-records.md",
      },
    ]);
  });

  test("Stores log entries for file", async () => {
    const { getState } = await setUp();

    expect(
      selectEntriesForPath(
        getState(),
        "fixtures/fixture-vault/one-task-two-log-records.md",
      ),
    ).toMatchObject([
      {
        text: "- [ ] Task",
      },
    ]);
  });

  test("Returns time block views for active log entries", async () => {
    const { getState } = await setUp();

    expect(selectActiveClocks(getState())).toMatchObject([
      {
        text: "- [ ] Task",
        startTime: window.moment("2025-01-01 17:00"),
      },
    ]);
  });

  test("Deletes entries on file deletion", async () => {
    const { getState, dispatch } = await setUp();

    dispatch(
      fileDeleted({
        path: "fixtures/fixture-vault/one-task-two-log-records.md",
      }),
    );

    expect(
      selectEntriesForPath(
        getState(),
        "fixtures/fixture-vault/one-task-two-log-records.md",
      ),
    ).toBeFalsy();
  });

  test("Replaces old entries on file change", async () => {
    const { getState, dispatch } = await setUp();

    expect(
      selectEntriesForPath(getState(), "fixtures/fixture-vault/test.md"),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("Nested task with 1 log record"),
        }),
        expect.objectContaining({
          text: expect.stringContaining("Task with 3 log records"),
        }),
      ]),
    );

    dispatch(
      metadataChanged({
        path: "fixtures/fixture-vault/test.md",
        cache: {},
        contents: "",
      }),
    );

    expect(
      selectEntriesForPath(getState(), "fixtures/fixture-vault/test.md"),
    ).toHaveLength(0);
  });

  test("Returns time block views in range", async () => {
    const { getState } = await setUp();

    expect(
      selectLogEntriesForDayKeys(getState(), ["2025-07-18"]),
    ).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Nested task with 1 log record"),
      }),
    );
  });

  test("Does not select deleted tasks within date range", async () => {
    const { dispatch, getState } = await setUp();

    dispatch(
      metadataChanged({
        path: "fixtures/fixture-vault/test.md",
        cache: {},
        contents: "",
      }),
    );

    expect(
      selectLogEntriesForDayKeys(getState(), ["2025-07-18"]),
    ).not.toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Nested task with 1 log record"),
      }),
    );
  });

  test.todo("No duplicates");

  test.todo("Consistency");

  test.todo("Old versions don't overwrite new ones");

  test.todo("Renaming a file removes entries by the old path");
});

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

describe("Task views", () => {
  describe("Frontmatter", () => {
    test.todo("Shows log entries from frontmatter");

    test.todo("Edits log entries from frontmatter");
  });

  test.fails(
    "Ignores tasks and lists outside of planner section in daily notes",
    async () => {
      const { editContext } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      const displayedTasks = editContext.getDisplayedTasksForTimeline(
        window.moment("2025-07-19"),
      );

      expect(get(displayedTasks)?.withTime).toHaveLength(1);
      expect(get(displayedTasks)?.withTime).toMatchObject([
        { startTime: window.moment("2025-07-19 11:00"), durationMinutes: 30 },
      ]);
    },
  );

  test.todo("Tasks do not contain duplicates");

  test.todo("Combines tasks from daily notes with tasks from other files");
});

describe("Editing", () => {
  describe("Daily notes", () => {
    test("Edits tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Un-schedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Creates tasks", async () => {
      const { editContext, moveCursorTo, vault } = await setUp({
        visibleDays: ["2025-07-19", "2025-07-20"],
      });

      moveCursorTo(window.moment("2025-07-20 13:00"));
      editContext.handlers.handleContainerMouseDown();
      moveCursorTo(window.moment("2025-07-20 14:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test(`* Moves a nested task with text between notes
* Does not touch invalid markdown
* Undoes the move`, async () => {
      const {
        editContext,
        moveCursorTo,
        vault,
        findByText,
        transactionWriter,
      } = await setUp({
        visibleDays: ["2025-07-28"],
        settings: {
          ...defaultSettingsForTests,
          sortTasksInPlanAfterEdit: true,
        },
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Child"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-20 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();

      await transactionWriter.undo();

      expect(
        Object.keys(getPathToDiff(vault.initialState, vault.state)).length,
      ).toBe(0);
    });

    describe("Sorting by time", () => {
      test.todo("Sorts tasks after non-mdast edit");

      test.todo("Skips sorting if day planner heading is not found");
    });
  });

  describe("Obsidian-tasks", () => {
    test("Schedules tasks & un-schedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Task without time"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 13:00"));

      await editContext.confirmEdit();

      editContext.handlers.handleGripMouseDown(
        findByText("Task with time"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test.todo(
      "Updates tasks plugin props without duplicating timestamps if moved to same time on another day",
    );
  });
});
