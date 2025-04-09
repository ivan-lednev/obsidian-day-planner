import { request } from "obsidian";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { initialState as initialGlobalState } from "../../src/redux/global-slice";
import {
  icalRefreshRequested,
  selectRemoteTasks,
} from "../../src/redux/ical/ical-slice";
import { initListenerMiddleware } from "../../src/redux/listener-middleware";
import { makeStore, type RootState } from "../../src/redux/store";
import { defaultSettingsForTests } from "../../src/settings";

import { FakeDataviewFacade, getIcalFixture } from "./redux.test";

vi.mock("obsidian", () => ({
  request: vi.fn(),
}));

const defaultPreloadedStateForTests: Partial<RootState> = {
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
};

function makeStoreForTests(props?: { preloadedState?: Partial<RootState> }) {
  const { preloadedState = defaultPreloadedStateForTests } = props || {};

  const listenerMiddleware = initListenerMiddleware({
    extra: {
      dataviewFacade: new FakeDataviewFacade(),
    },
    onIcalsFetched: async () => {},
  });

  return makeStore({
    preloadedState,
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(listenerMiddleware.middleware);
    },
  });
}

describe("ical", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Tasks contain RSVP status, description, location", async () => {
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
        description: "tentative-description",
        location: "Mount Everest",
        rsvpStatus: "TENTATIVE",
      }),
    ]);
  });

  // NOTE: Microsoft doesn't contain Attendee field
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

  test.each([
    ["2024-10-15", "2024-10-16"],
    ["2024-10-11", "2024-10-12"],
  ])(
    "Shows multi-day tasks that start before or after the visible range, row $#",
    async (...visibleDays) => {
      vi.mocked(request).mockReturnValue(
        getIcalFixture("google-event-stretching-5-days"),
      );

      const { dispatch, getState } = makeStoreForTests({
        preloadedState: {
          ...defaultPreloadedStateForTests,
          obsidian: {
            ...initialGlobalState,
            visibleDays,
          },
        },
      });

      dispatch(icalRefreshRequested());

      await vi.waitUntil(() => selectRemoteTasks(getState()).length > 0);

      const remoteTasks = selectRemoteTasks(getState());

      expect(remoteTasks).toHaveLength(1);
    },
  );

  test("Events don't get duplicated if they fall within 2 separate ranges", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-event-stretching-5-days"),
    );

    const { dispatch, getState } = makeStoreForTests({
      preloadedState: {
        ...defaultPreloadedStateForTests,
        obsidian: {
          ...initialGlobalState,
          visibleDays: ["2024-10-12", "2024-10-16"],
        },
      },
    });

    dispatch(icalRefreshRequested());

    await vi.waitUntil(() => selectRemoteTasks(getState()).length > 0);

    const remoteTasks = selectRemoteTasks(getState());

    expect(remoteTasks).toHaveLength(1);
  });

  // todo: failing because of timezone confusion
  test.skip("A recurrent 2-day event occupies exactly 2 days", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-2-day-event-every-wed"),
    );

    const { dispatch, getState } = makeStoreForTests({
      preloadedState: {
        ...defaultPreloadedStateForTests,
        obsidian: {
          ...initialGlobalState,
          visibleDays: [
            "2025-04-07",
            "2025-04-08",
            "2025-04-09",
            "2025-04-10",
            "2025-04-11",
          ],
        },
      },
    });

    dispatch(icalRefreshRequested());

    await vi.waitUntil(() => selectRemoteTasks(getState()).length > 0);

    const remoteTasks = selectRemoteTasks(getState());

    expect(remoteTasks).toEqual([
      expect.objectContaining({
        durationMinutes: 60 * 24 * 2,
      }),
    ]);
  });

  test("Deleted recurrences don't show up as tasks", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-deleted-recurrence"),
    );

    const { dispatch, getState } = makeStoreForTests({
      preloadedState: {
        ...defaultPreloadedStateForTests,
        obsidian: {
          ...initialGlobalState,
          visibleDays: ["2025-04-09", "2025-04-10", "2025-04-11", "2025-04-12"],
        },
      },
    });

    dispatch(icalRefreshRequested());

    await vi.waitUntil(() => selectRemoteTasks(getState()).length > 0);

    const remoteTasks = selectRemoteTasks(getState());

    expect(remoteTasks).toHaveLength(2);

    expect(remoteTasks[0].startTime).toEqual(
      window.moment("2025-04-09T00:00:00.000Z"),
    );
    expect(remoteTasks[1].startTime).toEqual(
      window.moment("2025-04-11T00:00:00.000Z"),
    );
  });

  test("Yearly recurrences do not show up every month", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-yearly-recurrence"),
    );

    const { dispatch, getState } = makeStoreForTests({
      preloadedState: {
        ...defaultPreloadedStateForTests,
        obsidian: {
          ...initialGlobalState,
          visibleDays: [
            "2025-04-09",
            "2025-05-08",
            "2025-05-09",
            "2025-05-10",
            "2026-04-08",
            "2026-04-09",
            "2026-04-10",
          ],
        },
      },
    });

    dispatch(icalRefreshRequested());

    await vi.waitUntil(() => selectRemoteTasks(getState()).length > 0);

    const remoteTasks = selectRemoteTasks(getState());

    expect(remoteTasks).toHaveLength(2);

    expect(remoteTasks[0].startTime).toEqual(
      window.moment("2025-04-09T00:00:00.000Z"),
    );
    expect(remoteTasks[1].startTime).toEqual(
      window.moment("2026-04-09T00:00:00.000Z"),
    );
  });

  describe("Time zones", () => {
    test.todo("Time zones get calculated correctly for recurrences");
  });
});
