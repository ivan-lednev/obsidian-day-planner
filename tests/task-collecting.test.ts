import { describe, test } from "vitest";

import  { type DataviewFacade } from "src/service/dataview-facade";

class FakeDataviewFacade implements DataviewFacade {
  getAllTasksFrom = (source: string) => {
    return Promise.resolve([]);
  };

  getAllListsFrom = (source: string) => {};

  getTaskAtLine({ path, line }: { path: string; line: number }) {
    throw new Error("Method not implemented.");
  }
}

describe("Task collecting", () => {
  test("Reads log data", () => {
    const dataviewFacade = new FakeDataviewFacade();


  });

  test.todo("Ignores tasks and lists outside of planner section");

  test.todo("Tasks with active clocks receive durations set to current time");

  test.todo("Tasks do not contain duplicates");

  test.todo("Splits clocks over midnight");

  test.todo("Combines tasks from daily notes with tasks from other files");
});
