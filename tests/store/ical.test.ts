import { createListenerMiddleware } from "@reduxjs/toolkit";
import { request } from "obsidian";
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
  type AppDispatch,
  makeStore,
  type RootState,
} from "../../src/redux/store";
import { defaultSettingsForTests } from "../../src/settings";
import type { ReduxExtraArgument } from "../../src/types";

import { FakeDataviewFacade, getIcalFixture } from "./redux.test";

vi.mock("obsidian", () => ({
  request: vi.fn(),
}));

function makeStoreForTests() {
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

  const { dispatch, getState } = store;

  dispatch(icalListenerStarted());

  return { dispatch, getState };
}

describe("ical", () => {
  test("RSVP status appears in tasks", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-tentative-attendee"),
    );

    const { dispatch, getState } = makeStoreForTests();

    dispatch(icalRefreshRequested());

    await vi.waitUntil(() => selectRemoteTasks(getState()).length > 0);

    const remoteTasks = selectRemoteTasks(getState());

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

  test.skip("Falls back on previous values if fetching a calendar fails", async () => {
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
