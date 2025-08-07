import { readFile } from "fs/promises";

import { type MetadataCache, request, Vault } from "obsidian";
import { SListEntry, type STask } from "obsidian-dataview";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { initialState as initialGlobalState } from "../../src/redux/global-slice";
import {
  icalRefreshRequested,
  selectRemoteTasks,
} from "../../src/redux/ical/ical-slice";
import { initListenerMiddleware } from "../../src/redux/listener-middleware";
import { makeStore, type RootState } from "../../src/redux/store";
import { DataviewFacade } from "../../src/service/dataview-facade";
import { ListPropsParser } from "../../src/service/list-props-parser";
import { defaultSettingsForTests } from "../../src/settings";
import { FakeMetadataCache, InMemoryVault } from "../test-utils";

vi.mock("obsidian", () => ({
  request: vi.fn(),
}));

const defaultVisibleDays = ["2024-09-26"];

export async function getIcalFixture(file: string) {
  return readFile(`fixtures/${file}.txt`, {
    encoding: "utf8",
  });
}

export class FakeDataviewFacade {
  constructor(
    private readonly fixtures: { tasks: STask[]; lists: SListEntry[] },
  ) {}

  async getAllTasksFrom() {
    return this.fixtures.tasks;
  }

  getAllListsFrom() {
    return this.fixtures.lists;
  }
}

const defaultPreloadedStateForTests: Partial<RootState> = {
  obsidian: {
    ...initialGlobalState,
    visibleDays: defaultVisibleDays,
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
      dataviewFacade: new FakeDataviewFacade({
        lists: [],
        tasks: [],
      }) as unknown as DataviewFacade,
      listPropsParser: new ListPropsParser(
        new InMemoryVault([]) as unknown as Vault,
        new FakeMetadataCache({}) as unknown as MetadataCache,
      ),
      onIcalsFetched: async () => {},
    },
  });

  return makeStore({
    preloadedState,
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(listenerMiddleware.middleware);
    },
  });
}

async function setUp(props: {
  icalFixtureFileName: string;
  visibleDays?: string[];
}) {
  const { icalFixtureFileName, visibleDays = defaultVisibleDays } = props;

  vi.mocked(request).mockReturnValue(getIcalFixture(icalFixtureFileName));

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

  return {
    remoteTasks: selectRemoteTasks(getState()),
    dispatch,
    getState,
  };
}

describe("ical", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("Tasks contain RSVP status, description, location", async () => {
    const { remoteTasks } = await setUp({
      icalFixtureFileName: "google-tentative-attendee",
      visibleDays: ["2024-09-26"],
    });

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
    const { dispatch, getState } = await setUp({
      icalFixtureFileName: "google-tentative-attendee",
    });

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
      const { remoteTasks } = await setUp({
        icalFixtureFileName: "google-event-stretching-5-days",
        visibleDays,
      });

      expect(remoteTasks).toHaveLength(1);
    },
  );

  test("Events don't get duplicated if they fall within 2 separate ranges", async () => {
    const { remoteTasks } = await setUp({
      icalFixtureFileName: "google-event-stretching-5-days",
      visibleDays: ["2024-10-12", "2024-10-16"],
    });

    expect(remoteTasks).toHaveLength(1);
  });

  // TODO: check out https://github.com/jens-maus/node-ical/issues/36
  //  this odd behavior comes from the 'fix' to that bug
  //  need to avoid this:`["2025-03-26T00:00:00.000Z", "2025-03-27T23:00:00.000Z"]`
  test.skip("A recurrent 2-day event spans exactly 2 days", async () => {
    const { remoteTasks } = await setUp({
      icalFixtureFileName: "google-2-day-event-every-wed",
      visibleDays: [
        "2025-04-07",
        "2025-04-08",
        "2025-04-09",
        "2025-04-10",
        "2025-04-11",
      ],
    });

    expect(remoteTasks).toEqual([
      expect.objectContaining({
        durationMinutes: 60 * 24 * 2,
      }),
    ]);
  });

  test("Deleted recurrences don't show up as tasks", async () => {
    const { remoteTasks } = await setUp({
      icalFixtureFileName: "google-deleted-recurrence",
      visibleDays: ["2025-04-09", "2025-04-10", "2025-04-11"],
    });

    expect(remoteTasks).toHaveLength(2);

    expect(remoteTasks[0].startTime).toEqual(
      window.moment("2025-04-09T00:00:00.000Z"),
    );
    expect(remoteTasks[1].startTime).toEqual(
      window.moment("2025-04-11T00:00:00.000Z"),
    );
  });

  test("Yearly recurrences do not show up every month", async () => {
    const { remoteTasks } = await setUp({
      icalFixtureFileName: "google-yearly-recurrence",
      visibleDays: [
        "2025-04-09",
        "2025-05-08",
        "2025-05-09",
        "2025-05-10",
        "2026-04-08",
        "2026-04-09",
        "2026-04-10",
      ],
    });

    expect(remoteTasks).toHaveLength(2);

    expect(remoteTasks[0].startTime).toEqual(
      window.moment("2025-04-09T00:00:00.000Z"),
    );
    expect(remoteTasks[1].startTime).toEqual(
      window.moment("2026-04-09T00:00:00.000Z"),
    );
  });

  test("Last visible day is inclusive, i.e. events happening on the last day of the range get displayed", async () => {
    const { remoteTasks } = await setUp({
      icalFixtureFileName: "google-recurring-with-exception-and-location",
      visibleDays: ["2024-09-29"],
    });

    expect(remoteTasks).toHaveLength(1);
  });

  test.todo("Recurring workday all-day tasks do not show up on Sunday");

  // NOTE: this test will break on the newest version of node-ical, so we'll need it
  test.todo("Recurrences show up at the same time as the original task");

  describe("Daylight savings time", () => {
    test.todo("Base case");
  });
});
