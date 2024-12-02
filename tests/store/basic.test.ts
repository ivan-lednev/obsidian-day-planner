import { describe, expect, test } from "vitest";

import {
  queryUpdated,
  selectLimitedSearchResult,
} from "../../src/search-slice";
import { makeStore } from "../../src/store";

describe("Search", () => {
  test("Filters tasks with simple substring match", () => {
    const store = makeStore({
      middleware: () => [],
      preloadedState: {
        dataview: {
          dataviewLoaded: true,
          // todo: replace with factory
          dataviewTasks: [
            {
              text: "Task 1",
              children: [],
            },
            {
              text: "Task 2",
              children: [],
            },
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

  test.todo("Search results get limited");

  test.todo("Dataview gets re-queried on source change");

  test.todo("Dataview gets re-queried on dataview:metadata-change");
});
