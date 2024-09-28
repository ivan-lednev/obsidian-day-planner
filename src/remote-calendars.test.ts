import fs from "node:fs/promises";

import { waitFor } from "@testing-library/dom";
import type { Mock } from "jest-mock";
import moment from "moment";
import { get, writable } from "svelte/store";

import { defaultSettingsForTests } from "./settings";
import { useDayToEventOccurences } from "./util/use-day-to-event-occurences";

jest.mock("obsidian", () => ({
  request: jest.fn(),
}));

async function waitForNeverToHappen(callable: () => void) {
  await expect(waitFor(callable)).rejects.toEqual(expect.anything());
}

function getIcalFixture(file: string) {
  return fs.readFile(`fixtures/${file}.txt`, {
    encoding: "utf8",
  });
}

function getMockRequest(): Mock {
  return jest.requireMock("obsidian").request;
}

function createStore({ visibleDays = [moment("2024-09-26")] } = {}) {
  const syncTrigger = writable({});

  const store = useDayToEventOccurences({
    isOnline: writable(true),
    visibleDays: writable(visibleDays),
    syncTrigger,
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

const tentativeEventMatcher = {
  "2024-09-26": {
    noTime: [],
    withTime: [
      expect.objectContaining({
        summary: "tentative-status",
        rsvpStatus: "TENTATIVE",
      }),
    ],
  },
};

test("RSVP status appears in tasks", async () => {
  getMockRequest().mockReturnValue(getIcalFixture("google-tentative-attendee"));

  const { store } = createStore();

  await waitFor(() => {
    expect(get(store)).toEqual(tentativeEventMatcher);
  });
});

test("Falls back on previous values if fetching a calendar fails", async () => {
  getMockRequest().mockReturnValue(getIcalFixture("google-tentative-attendee"));

  const { store } = createStore();

  await waitFor(() => {
    expect(get(store)).toEqual(tentativeEventMatcher);
  });

  getMockRequest().mockReturnValue(
    Promise.reject(new Error("Mock calendar rejected")),
  );

  await waitForNeverToHappen(() => {
    expect(() => get(store)).toThrow();
  });
});

test("Deleted recurrences don't show up as tasks", async () => {
  getMockRequest().mockReturnValue(
    getIcalFixture("google-recurring-with-exception-and-location"),
  );

  const { store } = createStore({
    visibleDays: [moment("2024-09-27"), moment("2024-09-28")],
  });

  await waitFor(() => {
    expect(get(store)).toEqual({
      "2024-09-27": {
        noTime: [],
        withTime: [
          expect.objectContaining({
            summary: "recurring",
          }),
        ],
      },
    });
  });
});

test.todo("Location gets passed to an event");

test.todo("Yearly recurrences do not show up every month");

test.todo("Time zones get calculated correctly");
