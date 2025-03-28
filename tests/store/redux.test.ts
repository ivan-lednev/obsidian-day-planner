import { readFile } from "fs/promises";

import type { STask } from "obsidian-dataview";
import { describe, expect, test } from "vitest";

import {
  queryUpdated,
  selectLimitedSearchResult,
} from "../../src/redux/search-slice";
import { makeStore } from "../../src/redux/store";
import { DataviewFacade } from "../../src/service/dataview-facade";
import { createSTask } from "../../src/util/dataview";

export async function getIcalFixture(file: string) {
  return readFile(`fixtures/${file}.txt`, {
    encoding: "utf8",
  });
}

export class FakeDataviewFacade extends DataviewFacade {
  private readonly fixtures: Record<string, Array<STask>>;

  constructor() {
    super(() => {
      throw new Error("Incorrect usage");
    });

    // this.fixtures = readFileSync(`${fixturesPath}/dataview-fixtures.json`);
    this.fixtures = {};
  }

  getTasksFromPath = (path: string) => {
    return this.fixtures[path];
  };

  getPathsFrom = (source: string) => {
    return Object.keys(this.fixtures);
  };
}

describe("Search", () => {
  test("Filters tasks with simple substring match", () => {
    const store = makeStore({
      middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
      preloadedState: {
        dataview: {
          dataviewLoaded: true,
          dataviewTasks: [
            createSTask({
              text: "Task 1",
            }),
            createSTask({
              text: "Task 2",
            }),
          ],
        },
      },
    });

    expect(selectLimitedSearchResult(store.getState())).toHaveLength(0);

    store.dispatch(queryUpdated("1"));

    expect(selectLimitedSearchResult(store.getState())).toEqual([
      expect.objectContaining({
        text: expect.stringContaining("Task 1"),
      }),
    ]);
  });
});

describe("Dataview", () => {
  test.todo("Lists from daily notes get updated");

  test.todo("Dataview gets re-queried on source change");

  test.todo("Dataview gets re-queried on dataview:metadata-change");
});
