import fs from "node:fs/promises";

import { waitFor } from "@testing-library/dom";
import moment from "moment";
import { request } from "obsidian";
import { get, writable } from "svelte/store";
import { vi, test, expect, describe } from "vitest";

import { defaultSettingsForTests } from "../src/settings";
import { useRemoteTasks } from "../src/util/use-remote-tasks";

vi.mock("obsidian", () => ({
  request: vi.fn(),
}));

async function waitForNeverToHappen(callable: () => void) {
  await expect(waitFor(callable)).rejects.toEqual(expect.anything());
}

function getIcalFixture(file: string) {
  return fs.readFile(`fixtures/${file}.txt`, {
    encoding: "utf8",
  });
}

function createStore({ visibleDays = [moment("2024-09-26")] } = {}) {
  const syncTrigger = writable({});

  const store = useRemoteTasks({
    isOnline: writable(true),
    visibleDays: writable(visibleDays),
    refreshSignal: syncTrigger,
    settings: writable({
      ...defaultSettingsForTests,
      icals: [
        {
          name: "foo",
          email: "bishop1860@gmail.com",
          url: "url",
          color: "",
        },
      ],
    }),
  });

  return {
    store,
    syncTrigger,
  };
}

const tentativeEventMatcher = [
  expect.objectContaining({
    summary: "tentative-status",
    rsvpStatus: "TENTATIVE",
  }),
];

describe("ical", () => {
  test("RSVP status appears in tasks", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-tentative-attendee"),
    );

    const { store } = createStore();

    await waitFor(() => {
      expect(get(store)).toEqual(tentativeEventMatcher);
    });
  });

  test.todo(
    "RSVP status gets pulled from params if email is not in CN (common name)",
  );

  test("Falls back on previous values if fetching a calendar fails", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-tentative-attendee"),
    );

    const { store } = createStore();

    await waitFor(() => {
      expect(get(store)).toEqual(tentativeEventMatcher);
    });

    vi.mocked(request).mockReturnValue(
      Promise.reject(new Error("Mock calendar rejected")),
    );

    await waitForNeverToHappen(() => {
      expect(() => get(store)).toThrow();
    });
  });

  test("Deleted recurrences don't show up as tasks", async () => {
    vi.mocked(request).mockReturnValue(
      getIcalFixture("google-recurring-with-exception-and-location"),
    );

    const { store } = createStore({
      visibleDays: [moment("2024-09-27"), moment("2024-09-28")],
    });

    await waitFor(() => {
      expect(get(store)).toEqual([
        expect.objectContaining({
          summary: "recurring",
        }),
      ]);
    });
  });

  test.todo("Location gets passed to an event");

  test.todo("Yearly recurrences do not show up every month");

  test.todo("Time zones get calculated correctly");
});
