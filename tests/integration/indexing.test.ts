import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { describe, expect, test, vi } from "vitest";

import {
  selectActiveLogTimeBlocks,
  selectLogTimeBlocksForVisibleDays,
  selectNewestActiveLogTimeBlock,
  selectPlanTimeBlocksForVisibleDays,
} from "../../src/redux";
import {
  fileDeleted,
  indexRequested,
  selectEntriesForPath,
} from "../../src/redux/index/index-slice";
import { strictParse } from "../../src/util/moment";
import { getDayKey } from "../../src/util/time-block-utils";

import { setUp } from "./util/setup";

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

    expect(
      selectActiveLogTimeBlocks(getState(), window.moment("2025-01-01 18:30")),
    ).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task"),
        startTime: window.moment("2025-01-01 17:00"),
        durationMinutes: 90,
      }),
    );
  });

  test("Returns the most recently started active log entry", async () => {
    const { getState } = await setUp();

    expect(
      selectNewestActiveLogTimeBlock(
        getState(),
        window.moment("2025-07-19 12:30"),
      ),
    ).toMatchObject({
      path: "fixtures/fixture-vault/frontmatter-1-open-log-entry.md",
      startTime: window.moment("2025-07-19 12:00"),
    });
  });

  test("Deletes entries on file deletion", async () => {
    const { getState, dispatch } = await setUp({
      visibleDays: ["2025-01-01"],
    });

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
      selectLogTimeBlocksForVisibleDays(getState(), window.moment()),
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
    const now = window.moment();
    const { editContext } = await setUp({ visibleDays: [getDayKey(now)] });

    expect(
      get(editContext.getDisplayedLogTimeBlocksForTimeline(now)),
    ).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Task"),
        truncated: ["bottom"],
      }),
    );
  });

  test("Does not truncate active log entries in yesterday's view", async () => {
    const now = window.moment();
    const yesterday = now.clone().subtract(1, "day");
    const { editContext } = await setUp({
      visibleDays: [getDayKey(yesterday)],
    });

    const logTimeBlocksForYesterday = get(
      editContext.getDisplayedLogTimeBlocksForTimeline(yesterday),
    );

    const activeClock = logTimeBlocksForYesterday.find((it) =>
      it.text.includes("Task"),
    );

    expect(activeClock).not.toHaveProperty("truncated");
  });

  test("Returns time block views in range; nested blocks get parsed", async () => {
    const { getState } = await setUp({ visibleDays: ["2025-07-18"] });

    expect(
      selectLogTimeBlocksForVisibleDays(getState(), strictParse("2025-07-18")),
    ).toContainEqual(
      expect.objectContaining({
        text: expect.stringContaining("Nested task with 1 log record"),
      }),
    );
  });

  test("Deletes plan entries on file deletion", async () => {
    const { getState, dispatch } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
      visibleDays: ["2025-07-28"],
    });

    expect(selectPlanTimeBlocksForVisibleDays(getState())).not.toHaveLength(0);

    dispatch(fileDeleted({ path: "fixtures/fixture-vault/2025-07-28.md" }));

    expect(selectPlanTimeBlocksForVisibleDays(getState())).toHaveLength(0);
  });

  test("Replaces plan entries on file re-index without duplicates", async () => {
    const { getState, dispatch } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
      visibleDays: ["2025-07-28"],
    });

    const before = selectPlanTimeBlocksForVisibleDays(getState());

    expect(before.length).toBeGreaterThan(0);

    dispatch(indexRequested(["fixtures/fixture-vault/2025-07-28.md"]));

    await vi.waitFor(() => {
      expect(selectPlanTimeBlocksForVisibleDays(getState())).toHaveLength(
        before.length,
      );
    });
  });

  test("Does not select deleted tasks within date range", async () => {
    const { dispatch, getState, metadataCache } = await setUp({
      visibleDays: ["2025-07-18"],
    });

    const filePath = "fixtures/fixture-vault/test.md";

    const cache = metadataCache.getCache(filePath);

    // todo: to avoid this, we can let the tests know that this is a fake dep
    isNotVoid(cache, "Invalid test state");

    cache.listItems = [];

    dispatch(indexRequested([filePath]));

    await vi.waitFor(() => {
      expect(
        selectLogTimeBlocksForVisibleDays(
          getState(),
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
    const { getState } = await setUp({ visibleDays: ["2025-07-28"] });

    expect(selectPlanTimeBlocksForVisibleDays(getState())).toMatchObject([
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
    const { getState } = await setUp({ visibleDays: ["2025-07-19"] });

    expect(selectPlanTimeBlocksForVisibleDays(getState())).toEqual(
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
    const { getState } = await setUp({ visibleDays: ["2025-07-19"] });

    expect(selectPlanTimeBlocksForVisibleDays(getState())).toEqual(
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

  test("Stores tasks scheduled via Dataview inline fields", async () => {
    const { getState } = await setUp({ visibleDays: ["2025-07-19"] });

    expect(selectPlanTimeBlocksForVisibleDays(getState())).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: expect.stringContaining(
            "Task with Dataview `scheduled` prop in brackets",
          ),
          isAllDayEvent: true,
        }),
        expect.objectContaining({
          text: expect.stringContaining(
            "Task with Dataview `scheduled` prop in parens",
          ),
          isAllDayEvent: true,
        }),
      ]),
    );
  });

  test("Stores nested tasks and list items with positions with no duplicates", async () => {
    const { getState } = await setUp({
      loadedFixtures: ["2025-07-28.md"],
      visibleDays: ["2025-07-28"],
    });

    expect(selectPlanTimeBlocksForVisibleDays(getState())).toContainEqual(
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
});
