import { readFileSync, readdirSync, statSync } from "fs";

import { describe, expect, test } from "vitest";

class FakeDataviewFacade {
  getAllTasksFrom = (source: string) => {
    return Promise.resolve([]);
  };

  getAllListsFrom = (source: string) => {};
}

describe("Task collecting", () => {
  test.skip("Reads log data", () => {
    const metadataDump = readFileSync(
      "fixtures/metadata-dump/tasks.json",
      "utf-8",
    );
    const asJson = JSON.parse(metadataDump);

    const metadataDir = readdirSync("fixtures/fixture-vault", {
      withFileTypes: true,
    });

    const hren = [...metadataDir.entries()].map(([, it]) => [
      it.parentPath,
      statSync(it).mtime,
    ]);

    expect(asJson).toEqual("hren");
  });

  test.todo("Ignores tasks and lists outside of planner section");

  test.todo("Tasks with active clocks receive durations set to current time");

  test.todo("Tasks do not contain duplicates");

  test.todo("Splits clocks over midnight");

  test.todo("Combines tasks from daily notes with tasks from other files");
});
