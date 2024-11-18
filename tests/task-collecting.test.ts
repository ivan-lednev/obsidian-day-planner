import { describe, test } from "vitest";

describe("Task collecting", () => {
  test("Collects active clocks", () => {});

  test.todo(
    "When Dataview source is empty, tasks are pulled from visible daily notes",
  );

  test.todo("Ignores tasks and lists outside of planner section");

  test.todo("Tasks with active clocks receive durations set to current time");

  test.todo("Tasks do not contain duplicates");

  test.todo("Splits clocks over midnight");

  test.todo("Combines tasks from daily notes with tasks from other files");
});
