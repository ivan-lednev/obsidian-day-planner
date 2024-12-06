import { readFile } from "fs/promises";

import { createListenerMiddleware } from "@reduxjs/toolkit";
import { request } from "obsidian";
import type { STask } from "obsidian-dataview";
import { describe, expect, test, vi } from "vitest";

import { initDataviewListeners } from "../../src/redux/dataview/init-dataview-listeners";
import { initialState as initialGlobalState } from "../../src/redux/global-slice";
import {
  icalListenerStarted,
  icalRefreshRequested,
  selectRemoteTasks,
} from "../../src/redux/ical/ical-slice";
import { initIcalListeners } from "../../src/redux/ical/init-ical-listeners";
import {
  queryUpdated,
  selectLimitedSearchResult,
} from "../../src/redux/search-slice";
import {
  type AppDispatch,
  makeStore,
  type RootState,
} from "../../src/redux/store";
import { DataviewFacade } from "../../src/service/dataview-facade";
import { defaultSettingsForTests } from "../../src/settings";
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
  test("RSVP status appears in tasks", async () => {
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
          dateRanges: { key: ["2024-09-26"] },
        },
        settings: {
          settings: {
            ...defaultSettingsForTests,
            icals: [
              {
                name: "Test",
                url: "https://example.com",
                color: "#ff0000",
                email: "bishop1860@gmail.com",
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

    expect(remoteTasks).toEqual([
      expect.objectContaining({
        summary: "tentative-status",
        rsvpStatus: "TENTATIVE",
      }),
    ]);
  });

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
          dateRanges: { key: ["2024-09-25", "2024-09-26", "2024-09-27"] },
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

    vi.mocked(request).mockImplementationOnce(() => {
      throw new Error("Request failed");
    });

    dispatch(icalRefreshRequested());

    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    const remoteTasks = selectRemoteTasks(store.getState());

    expect(remoteTasks).toHaveLength(1);
  });

  test.todo("Deleted recurrences don't show up as tasks");

  test.todo("Location gets passed to an event");

  test.todo("Yearly recurrences do not show up every month");

  test.todo("Time zones get calculated correctly");
});
