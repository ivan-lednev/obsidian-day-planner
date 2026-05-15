import { get } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { describe, expect, test } from "vitest";

import { selectPlanEntriesForDays } from "../../src/redux";
import { defaultSettingsForTests } from "../../src/settings";
import { toRenderableMarkdown } from "../../src/util/task-utils";

import { setUp } from "./util/setup";

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
