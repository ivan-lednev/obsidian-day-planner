import { request } from "obsidian";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { initialState as initialGlobalState } from "../../src/redux/global-slice";
import {
  icalRefreshRequested,
  selectRemoteTasks,
} from "../../src/redux/ical/ical-slice";
import { initListenerMiddleware } from "../../src/redux/listener-middleware";
import { makeStore } from "../../src/redux/store";
import { defaultSettingsForTests } from "../../src/settings";

import { FakeDataviewFacade, getIcalFixture } from "./redux.test";

vi.mock("obsidian", () => ({
  request: vi.fn(),
}));

function makeStoreForTests() {
  const listenerMiddleware = initListenerMiddleware({
    extra: {
      dataviewFacade: new FakeDataviewFacade(),
    },
    onIcalsFetched: async () => {},
  });

  return makeStore({
    preloadedState: {
      obsidian: {
        ...initialGlobalState,
        visibleDays: ["2024-09-26"],
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
}

describe("ical", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  test("Falls back on previous values if fetching a calendar fails", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-tentative-attendee"),
    );

    const { dispatch, getState } = makeStoreForTests();

    dispatch(icalRefreshRequested());

    await vi.waitUntil(() => selectRemoteTasks(getState()).length > 0);

    vi.mocked(request).mockImplementationOnce(() => {
      throw new Error("Request failed");
    });

    dispatch(icalRefreshRequested());

    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
    const remoteTasks = selectRemoteTasks(getState());

    expect(remoteTasks).toHaveLength(1);
  });

  test.todo("Deleted recurrences don't show up as tasks");

  test.todo("Location gets passed to an event");

  test.todo("Yearly recurrences do not show up every month");

  test.todo("Time zones get calculated correctly");
});
