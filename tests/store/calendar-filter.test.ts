import { describe, expect, test } from "vitest";

import { matchesAnyFilterPattern } from "../../src/redux/ical/init-ical-listeners";
import type { RemoteTask } from "../../src/task-types";

function makeRemoteTask(
  overrides: Partial<Pick<RemoteTask, "summary" | "description" | "location">>,
): RemoteTask {
  return {
    id: "test-id",
    startTime: window.moment("2024-09-26T13:00:00Z"),
    calendar: { name: "Test", url: "https://example.com", color: "#ff0000" },
    rsvpStatus: "ACCEPTED",
    summary: "Test event",
    ...overrides,
  };
}

describe("matchesAnyFilterPattern", () => {
  test("returns false when patterns list is empty", () => {
    const task = makeRemoteTask({ summary: "Name in Stockholm" });

    expect(matchesAnyFilterPattern(task, [])).toBe(false);
  });

  test("returns false when no pattern matches any field", () => {
    const task = makeRemoteTask({
      summary: "Team standup",
      description: "Daily sync",
      location: "Conference room A",
    });

    expect(matchesAnyFilterPattern(task, ["Stockholm", "vacation"])).toBe(
      false,
    );
  });

  test("matches pattern against summary (case-insensitive)", () => {
    const task = makeRemoteTask({ summary: "Anna in Stockholm" });

    expect(matchesAnyFilterPattern(task, ["in stockholm"])).toBe(true);
  });

  test("matches pattern against summary with different casing", () => {
    const task = makeRemoteTask({ summary: "ANNA IN STOCKHOLM" });

    expect(matchesAnyFilterPattern(task, ["in stockholm"])).toBe(true);
  });

  test("matches pattern against description", () => {
    const task = makeRemoteTask({
      summary: "Team event",
      description: "Anna in Stockholm",
    });

    expect(matchesAnyFilterPattern(task, ["in stockholm"])).toBe(true);
  });

  test("matches pattern against location", () => {
    const task = makeRemoteTask({
      summary: "Team event",
      location: "Stockholm office",
    });

    expect(matchesAnyFilterPattern(task, ["stockholm"])).toBe(true);
  });

  test("returns true if any one pattern matches", () => {
    const task = makeRemoteTask({ summary: "Vacation block" });

    expect(
      matchesAnyFilterPattern(task, ["in stockholm", "vacation"]),
    ).toBe(true);
  });

  test("ignores blank patterns", () => {
    const task = makeRemoteTask({ summary: "Team standup" });

    expect(matchesAnyFilterPattern(task, ["   ", ""])).toBe(false);
  });

  test("works when description is undefined", () => {
    const task = makeRemoteTask({
      summary: "Stockholm conference",
      description: undefined,
    });

    expect(matchesAnyFilterPattern(task, ["stockholm"])).toBe(true);
  });

  test("works when location is undefined", () => {
    const task = makeRemoteTask({
      summary: "Vacation block",
      location: undefined,
    });

    expect(matchesAnyFilterPattern(task, ["vacation"])).toBe(true);
  });

  test("substring match — partial word is enough", () => {
    const task = makeRemoteTask({ summary: "vacation week" });

    expect(matchesAnyFilterPattern(task, ["vacat"])).toBe(true);
  });
});
