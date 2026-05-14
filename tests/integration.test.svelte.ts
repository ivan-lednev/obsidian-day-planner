import { Effect } from "effect";
import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { describe, expect, test, vi } from "vitest";

import { selectLogEntriesForDay, selectPlanEntriesForDays } from "../src/redux";
import {
  fileDeleted,
  indexRequested,
  selectActiveLogEntries,
  selectEntriesForPath,
} from "../src/redux/index/index-slice";
import { defaultSettingsForTests } from "../src/settings";
import { EditMode } from "../src/ui/hooks/use-edit/types";
import { strictParse } from "../src/util/moment";
import { addOpenClock, createPropsWithOpenClock } from "../src/util/props";
import { getDayKey, toRenderableMarkdown } from "../src/util/task-utils";

import { setUp } from "./integration/setup";
import { getPathToDiff } from "./test-utils";

describe("Indexing", () => {
  test("Stores text, path, position, props position for task entries", async () => {
    const { getState } = await setUp();

    expect(
      selectEntriesForPath(
        getState(),
        "fixtures/fixture-vault/one-task-two-log-records.md",
      ),
    ).toMatchObject([
      {
        text: expect.stringContaining("Task"),
        position: {
          start: expect.any(Object),
          end: expect.any(Object),
        },
        propsPosition: {
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
        text: expect.stringContaining("Task"),
      },
    ]);
  });

  test("Returns time block views for active log entries", async () => {
    const { getState } = await setUp();

    expect(selectActiveLogEntries(getState())).toMatchObject([
      {
        text: expect.stringContaining("Task"),
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

    expect(
      selectLogEntriesForDay(getState(), "2025-01-01", window.moment()),
    ).toEqual([]);
  });

  test("Replaces old entries on file change", async () => {
    const { getState, dispatch, metadataCache } = await setUp();

    const filePath = "fixtures/fixture-vault/test.md";

    expect(selectEntriesForPath(getState(), filePath)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("Nested task with 1 log record"),
        }),
        expect.objectContaining({
          text: expect.stringContaining("Task with 3 log records"),
        }),
      ]),
    );

    const cache = metadataCache.getCache(filePath);

    // todo: to avoid this, we can let the tests know that this is a fake dep
    isNotVoid(cache, "Invalid test state");

    cache.listItems = [];

    dispatch(indexRequested([filePath]));

    await vi.waitFor(() => {
      expect(selectEntriesForPath(getState(), filePath)).toHaveLength(0);
    });
  });

  test("Returns truncated active log entries for today's range", async () => {
    const { getState } = await setUp();
    const now = window.moment();

    expect(
      selectLogEntriesForDay(getState(), getDayKey(now), now),
    ).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task"),
        truncated: ["bottom"],
      }),
    );
  });

  test("Does not truncate active log entries in yesterday's view", async () => {
    const { getState } = await setUp();
    const now = window.moment();
    const yesterday = now.clone().subtract(1, "day");

    const logEntriesForYesterday = selectLogEntriesForDay(
      getState(),
      getDayKey(yesterday),
      now,
    );

    const activeClock = logEntriesForYesterday.find((it) =>
      it.text.includes("Task"),
    );

    expect(activeClock).not.toHaveProperty("truncated");
  });

  test("Returns time block views in range; nested blocks get parsed", async () => {
    const { getState } = await setUp();

    expect(
      selectLogEntriesForDay(
        getState(),
        "2025-07-18",
        strictParse("2025-07-18"),
      ),
    ).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Nested task with 1 log record"),
      }),
    );
  });

  test("Deletes plan entries on file deletion", async () => {
    const { getState, dispatch } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
    });

    expect(
      selectPlanEntriesForDays(getState(), ["2025-07-28"]),
    ).not.toHaveLength(0);

    dispatch(fileDeleted({ path: "fixtures/fixture-vault/2025-07-28.md" }));

    expect(selectPlanEntriesForDays(getState(), ["2025-07-28"])).toHaveLength(
      0,
    );
  });

  test("Replaces plan entries on file re-index without duplicates", async () => {
    const { getState, dispatch } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
    });

    const before = selectPlanEntriesForDays(getState(), ["2025-07-28"]);

    expect(before.length).toBeGreaterThan(0);

    dispatch(indexRequested(["fixtures/fixture-vault/2025-07-28.md"]));

    await vi.waitFor(() => {
      expect(selectPlanEntriesForDays(getState(), ["2025-07-28"])).toHaveLength(
        before.length,
      );
    });
  });

  test("Does not select deleted tasks within date range", async () => {
    const { dispatch, getState, metadataCache } = await setUp();

    const filePath = "fixtures/fixture-vault/test.md";

    const cache = metadataCache.getCache(filePath);

    // todo: to avoid this, we can let the tests know that this is a fake dep
    isNotVoid(cache, "Invalid test state");

    cache.listItems = [];

    dispatch(indexRequested([filePath]));

    await vi.waitFor(() => {
      expect(
        selectLogEntriesForDay(
          getState(),
          "2025-07-18",
          strictParse("2025-07-18"),
        ),
      ).not.toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining("Nested task with 1 log record"),
        }),
      );
    });
  });

  test("Stores tasks from daily notes basing their start time on daily note path", async () => {
    const { getState } = await setUp();

    expect(selectPlanEntriesForDays(getState(), ["2025-07-28"])).toMatchObject([
      {
        text: expect.stringContaining("Before"),
      },
      {
        text: expect.stringContaining("Parent"),
      },
      {
        text: expect.stringContaining("Child"),
      },
      {
        text: expect.stringContaining("After"),
      },
    ]);
  });

  test("Stores list items from daily notes basing their start time on daily note path", async () => {
    const { getState } = await setUp();

    expect(selectPlanEntriesForDays(getState(), ["2025-07-19"])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("List item under planner heading"),
        }),
        expect.objectContaining({
          text: expect.stringContaining("Task"),
        }),
      ]),
    );
  });

  test("Stores tasks from obsidian-tasks (scheduled)", async () => {
    const { getState } = await setUp();

    expect(selectPlanEntriesForDays(getState(), ["2025-07-19"])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining("Task with time"),
          startTime: window.moment("2025-07-19 10:00"),
        }),
        expect.objectContaining({
          text: expect.stringContaining("Task without time"),
          isAllDayEvent: true,
        }),
      ]),
    );
  });

  test.todo("Stores Dataview tasks");

  test("Stores nested tasks and list items with positions with no duplicates", async () => {
    const { getState } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
    });

    expect(selectPlanEntriesForDays(getState(), ["2025-07-28"])).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Parent"),
        children: [
          expect.objectContaining({
            text: expect.stringContaining("Child task"),
            task: " ",
            position: expect.any(Object),
            children: [
              expect.objectContaining({
                text: expect.stringContaining("Child list item without time"),
                position: expect.any(Object),
              }),
            ],
          }),
        ],
      }),
    );
  });

  test.todo("Does not fail on list items inside other list items' lines");

  test.todo(
    "Nothing gets triggered for files that do not contain any tasks or relevant props",
  );

  test.todo("Old versions don't overwrite new ones");

  test.todo("Renaming a file removes entries by the old path");

  test.todo("Ignores invalid dates, extra keys");

  describe("Clocking in", () => {
    test("Clocks in on tasks without clocks", async () => {
      vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

      const { taskEntryEditor, vault } = await setUp({
        loadedFixtures: ["2025-07-19.md"],
      });

      await Effect.runPromise(
        taskEntryEditor.editProps({
          path: "fixtures/fixture-vault/2025-07-19.md",
          line: 12,
          editFn: (props) =>
            props ? addOpenClock(props) : createPropsWithOpenClock(),
        }),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Clocks in on tasks with existing clocks", async () => {
      vi.useFakeTimers({ now: new Date("2026-01-01 17:00") });

      const { taskEntryEditor, vault } = await setUp({
        loadedFixtures: ["test.md"],
      });

      await Effect.runPromise(
        taskEntryEditor.editProps({
          path: "fixtures/fixture-vault/test.md",
          line: 7,
          editFn: (props) => {
            isNotVoid(props);

            return addOpenClock(props);
          },
        }),
      );

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Does not clock in on bullet list items", async () => {
      const { taskEntryEditor } = await setUp({
        loadedFixtures: ["2025-07-19.md"],
      });

      await expect(
        Effect.runPromise(
          taskEntryEditor.editProps({
            path: "fixtures/fixture-vault/2025-07-19.md",
            line: 0,
            editFn: () => createPropsWithOpenClock(),
          }),
        ),
      ).rejects.toThrow("Cannot add props to an item that's not a task");
    });

    test("Does not clock in on tasks with active clocks", async () => {
      const { taskEntryEditor } = await setUp({
        loadedFixtures: ["one-task-two-log-records.md"],
      });

      await expect(
        Effect.runPromise(
          taskEntryEditor.editProps({
            path: "fixtures/fixture-vault/one-task-two-log-records.md",
            line: 0,
            editFn: (props) => {
              isNotVoid(props);

              return addOpenClock(props);
            },
          }),
        ),
      ).rejects.toThrow("There is already an open clock");
    });

    test.todo("Does not mess up other child blocks in list");

    test.todo("Keeps other props as is");

    test.todo(
      "For a single line in a file, adds a newline instead of appending the code block to the line",
    );

    test.todo(
      "If a property block is messed up, it replaces it instead of adding another one",
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
  test("Shows nested list items (tasks & plain list items) with their paragraphs and checkboxes", async () => {
    const { getState } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
    });

    const planEntries = selectPlanEntriesForDays(getState(), ["2025-07-28"]);
    const taskWithNestedListItems = planEntries.find((entry) =>
      entry.text.includes("Parent"),
    );

    isNotVoid(taskWithNestedListItems);

    const { nestedListItems } = toRenderableMarkdown(taskWithNestedListItems);

    expect(nestedListItems).toBe(`- [ ] Child task
  Child text
\t- Child list item without time
`);
  });

  test.todo("Does not show code blocks in rendered markdown");

  test("With empty plannerHeading, indexes tasks outside the planner section", async () => {
    const { getState } = await setUp({
      visibleDays: ["2025-07-19"],
      settings: {
        ...defaultSettingsForTests,
        plannerHeading: "",
      },
    });

    expect(selectPlanEntriesForDays(getState(), ["2025-07-19"])).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task outside of planner heading"),
      }),
    );
  });

  test("Ignores tasks and lists outside of planner section in daily notes", async () => {
    const { editContext } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTasks = editContext.getDisplayedTasksForTimeline(
      window.moment("2025-07-19"),
    );

    expect(get(displayedTasks)?.noTime).not.toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task outside of planner heading"),
      }),
    );
  });

  test("Combines tasks from daily notes with tasks from other files", async () => {
    const { editContext } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTasks = editContext.getDisplayedTasksForTimeline(
      window.moment("2025-07-19"),
    );

    const { withTime, noTime } = get(displayedTasks);

    expect(withTime).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("List item under planner heading"),
      }),
    );
    expect(withTime).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task with time"),
      }),
    );

    expect(noTime).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task without time"),
      }),
    );
  });
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
    test("Schedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Task without time"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 13:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Unschedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

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
