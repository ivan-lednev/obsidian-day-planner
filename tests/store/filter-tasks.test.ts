import { noop } from "lodash/fp";
import { derived, get, writable } from "svelte/store";
import { describe, expect, test, vi } from "vitest";

import type { PeriodicNotes } from "../../src/service/periodic-notes";
import { WorkspaceFacade } from "../../src/service/workspace-facade";
import type { DayPlannerSettings } from "../../src/settings";
import { defaultSettingsForTests } from "../../src/settings";
import type { LocalTask, RemoteTask } from "../../src/task-types";
import type { PointerDateTime } from "../../src/types";
import { useEditContext } from "../../src/ui/hooks/use-edit/use-edit-context";
import { localTaskMatchesAnyPattern, remoteTaskMatchesAnyPattern } from "../../src/util/task-filter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRemoteTask(
  overrides: Partial<Pick<RemoteTask, "summary" | "description" | "location">>,
): RemoteTask {
  return {
    id: "remote-1",
    startTime: window.moment("2024-09-26T13:00:00Z"),
    calendar: { name: "Test", url: "https://example.com", color: "#ff0000" },
    rsvpStatus: "ACCEPTED",
    summary: "Test event",
    ...overrides,
  };
}

function makeLocalTask(text: string, id = "local-1"): LocalTask {
  return {
    id,
    startTime: window.moment("2024-09-26T09:00:00Z"),
    durationMinutes: 60,
    symbol: "-",
    text,
  };
}

function makeContext(
  localTasksInit: LocalTask[],
  remoteTasksInit: RemoteTask[],
  patterns: string[],
) {
  const localTasks = writable<LocalTask[]>(localTasksInit);
  const remoteTasks = writable<RemoteTask[]>(remoteTasksInit);
  const settingsStore = writable<DayPlannerSettings>({
    ...defaultSettingsForTests,
    calendarFilterPatterns: patterns,
  });

  const filteredLocalTasks = derived(
    [localTasks, settingsStore],
    ([$local, $settings]) =>
      $local.filter((t) => !localTaskMatchesAnyPattern(t, $settings.calendarFilterPatterns)),
  );

  const filteredRemoteTasks = derived(
    [remoteTasks, settingsStore],
    ([$remote, $settings]) =>
      $remote.filter((t) => !remoteTaskMatchesAnyPattern(t, $settings.calendarFilterPatterns)),
  );

  const { dayToDisplayedTasks } = useEditContext({
    settings: settingsStore,
    localTasks: filteredLocalTasks,
    remoteTasks: filteredRemoteTasks,
    onUpdate: vi.fn(),
    onEditAborted: vi.fn(),
    workspaceFacade: vi.fn() as unknown as WorkspaceFacade,
    abortEditTrigger: writable(),
    pointerDateTime: writable<PointerDateTime>({
      dateTime: window.moment("2024-09-26T09:00:00Z"),
      type: "dateTime",
    }),
    periodicNotes: {
      getDateFromPath: vi.fn(() => null),
      getDailyNoteSettings: vi.fn(() => ({ format: "YYYY-MM-DD", folder: "." })),
    } as unknown as PeriodicNotes,
  });

  dayToDisplayedTasks.subscribe(noop);

  return { filteredLocalTasks, filteredRemoteTasks, dayToDisplayedTasks, settingsStore };
}

function displayedIds(context: ReturnType<typeof makeContext>) {
  return Object.values(get(context.dayToDisplayedTasks)).flatMap(
    (day) => day.withTime.map((t) => t.id),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("calendar filter", () => {
  test("hides matched remote tasks", () => {
    const { filteredRemoteTasks } = makeContext(
      [],
      [makeRemoteTask({ summary: "Team standup" }), makeRemoteTask({ summary: "Personal errand" })],
      ["personal"],
    );

    const result = get(filteredRemoteTasks);
    expect(result).toHaveLength(1);
    expect(result[0].summary).toBe("Team standup");
  });

  test("hides matched local tasks", () => {
    const { filteredLocalTasks } = makeContext(
      [makeLocalTask("Team standup", "a"), makeLocalTask("Personal errand", "b")],
      [],
      ["personal"],
    );

    const result = get(filteredLocalTasks);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe("Team standup");
  });

  test("shows all tasks when patterns list is empty", () => {
    const { filteredLocalTasks, filteredRemoteTasks } = makeContext(
      [makeLocalTask("Team standup")],
      [makeRemoteTask({ summary: "Personal errand" })],
      [],
    );

    expect(get(filteredLocalTasks)).toHaveLength(1);
    expect(get(filteredRemoteTasks)).toHaveLength(1);
  });

  test("reacts to pattern changes", () => {
    const { filteredLocalTasks, settingsStore } = makeContext(
      [makeLocalTask("Personal errand")],
      [],
      [],
    );

    expect(get(filteredLocalTasks)).toHaveLength(1);

    settingsStore.update((s) => ({ ...s, calendarFilterPatterns: ["personal"] }));

    expect(get(filteredLocalTasks)).toHaveLength(0);
  });

  test("hidden tasks do not reach dayToDisplayedTasks", () => {
    const ctx = makeContext(
      [makeLocalTask("Personal errand", "excluded"), makeLocalTask("Team standup", "visible")],
      [],
      ["personal"],
    );

    expect(displayedIds(ctx)).not.toContain("excluded");
    expect(displayedIds(ctx)).toContain("visible");
  });

  test("all tasks reach dayToDisplayedTasks when no patterns are set", () => {
    const ctx = makeContext(
      [makeLocalTask("Personal errand", "excluded"), makeLocalTask("Team standup", "visible")],
      [],
      [],
    );

    expect(displayedIds(ctx)).toContain("excluded");
    expect(displayedIds(ctx)).toContain("visible");
  });
});
