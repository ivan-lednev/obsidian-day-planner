import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import { setUp } from "./init-test-system";

describe("Task views", () => {
  describe("Frontmatter", () => {
    test.todo("Shows log entries from frontmatter");

    test.todo("Edits log entries from frontmatter");
  });

  test("Ignores tasks and lists outside of planner section in daily notes", async () => {
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
  });

  test.todo("Tasks do not contain duplicates");

  test.todo("Combines tasks from daily notes with tasks from other files");
});
