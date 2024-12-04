import { readFile } from "fs/promises";

import { createListenerMiddleware } from "@reduxjs/toolkit";
import { request } from "obsidian";
import type { STask } from "obsidian-dataview";
import { describe, expect, test, vi } from "vitest";

import { initialState as initialGlobalState } from "../../src/globalSlice";
import {
  icalListenerStarted,
  icalRefreshRequested,
  selectRemoteTasks,
} from "../../src/ical-slice";
import { initDataviewListeners } from "../../src/init-dataview-listeners";
import { initIcalListeners } from "../../src/init-ical-listeners";
import {
  queryUpdated,
  selectLimitedSearchResult,
} from "../../src/search-slice";
import { DataviewFacade } from "../../src/service/dataview-facade";
import { defaultSettingsForTests } from "../../src/settings";
import { type AppDispatch, makeStore, type RootState } from "../../src/store";
import type { ReduxExtraArgument } from "../../src/types";
import { createSTask } from "../../src/util/dataview";

vi.mock("obsidian", () => ({
  request: vi.fn(),
}));

async function getIcalFixture(file: string) {
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
      middleware: () => [],
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

describe("ical", () => {
  test.todo("RSVP status appears in tasks");

  test.todo(
    "RSVP status gets pulled from params if email is not in CN (common name)",
  );

  test("Falls back on previous values if fetching a calendar fails", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-tentative-attendee"),
    );

    // todo: abstract away initialization
    const listenerMiddleware = createListenerMiddleware<
      RootState,
      AppDispatch,
      ReduxExtraArgument
    >({
      extra: {
        dataviewFacade: new FakeDataviewFacade(),
      },
    });

    initDataviewListeners(listenerMiddleware.startListening);
    initIcalListeners(listenerMiddleware.startListening);

    const store = makeStore({
      preloadedState: {
        obsidian: {
          ...initialGlobalState,
          dateRanges: { key: ["2024-09-27", "2024-09-28"] },
        },
        settings: {
          settings: {
            ...defaultSettingsForTests,
            icals: [
              {
                name: "Test",
                url: "https://example.com",
                color: "#ff0000",
              },
            ],
          },
        },
      },
      middleware: (getDefaultMiddleware) => {
        return getDefaultMiddleware().concat(listenerMiddleware.middleware);
      },
    });

    const { dispatch } = store;

    dispatch(icalListenerStarted());
    dispatch(icalRefreshRequested());

    await vi.waitUntil(() => selectRemoteTasks(store.getState()).length > 0);

    const remoteTasks = selectRemoteTasks(store.getState());

    expect(remoteTasks).toHaveLength(1);
  });

  test.todo("Deleted recurrences don't show up as tasks");

  test.todo("Location gets passed to an event");

  test.todo("Yearly recurrences do not show up every month");

  test.todo("Time zones get calculated correctly");
});
