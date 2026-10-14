// @vitest-environment node
import { dump, load, JSON_SCHEMA } from "js-yaml";
import { describe, expect, it, vi } from "vitest";

import {
  updateActivityDetails,
  appendNoteToActivity,
  cancelOpenClockByActivityIndex,
  clockOut,
  createActivityWeekFiles,
  getActivityAttributeFields,
  getInitialActivityValues,
  getResourceAliases,
  getResourceNamesByFieldKey,
  hasActivityFormChanges,
  hasOpenActivityClock,
  readActivityFile,
  readResourceFile,
  startActivityLog,
  type ActivityYamlCodec,
  type Activity,
} from "../src/shared/activity";

const yaml: ActivityYamlCodec = {
  parse: (contents) => load(contents, { schema: JSON_SCHEMA }),
  stringify: (data) => dump(data),
};

vi.mock("obsidian", () => {
  throw new Error("The shared activity API must not import Obsidian.");
});

describe("shared activity API without a UI or platform runtime", () => {
  it("starts, links tasks, appends notes, and finishes without mutating input records", () => {
    expect("window" in globalThis).toBe(false);
    const started = startActivityLog(
      { extra: "preserved" },
      "read",
      { read: { book: "Book", "start-page": 1 } },
      "2026-10-06 10:00:00",
    );
    const snapshot = structuredClone(started);
    const linked = updateActivityDetails(started, 0, { taskIds: ["task-1"] });
    const annotated = appendNoteToActivity(linked, 0, "  During activity  ");
    const finished = clockOut(
      annotated,
      0,
      { read: { "end-page": 12 }, quality: 8, notes: "At finish" },
      "2026-10-06 10:30:00",
    );
    expect(finished).toEqual({
      extra: "preserved",
      activities: [
        {
          activity: "read",
          taskIds: ["task-1"],
          log: [{ start: "2026-10-06 10:00:00", end: "2026-10-06 10:30:00" }],
          read: { book: "Book", "start-page": 1, "end-page": 12 },
          quality: 8,
          notes: "During activity\nAt finish",
        },
      ],
    });
    expect(started).toEqual(snapshot);
    expect(hasOpenActivityClock(finished.activities![0])).toBe(false);
  });

  it("completes the sole open log and preserves completed sessions when cancelling", () => {
    const record: Activity = {
      activity: "walk",
      taskIds: [],
      log: [
        { start: "2026-10-06 09:00:00", end: "2026-10-06 09:30:00" },
        { start: "2026-10-06 10:00:00" },
      ],
    };
    const finished = clockOut(
      { activities: [record] },
      0,
      {},
      "2026-10-06 10:30:00",
    );
    expect(finished.activities![0].log).toEqual([
      record.log![0],
      { start: "2026-10-06 10:00:00", end: "2026-10-06 10:30:00" },
    ]);
    const cancelled = cancelOpenClockByActivityIndex(
      { activities: [record] },
      0,
    );
    expect(cancelled.activities![0].log).toEqual([record.log![0]]);
    expect(record.log).toHaveLength(2);
  });

  it("writes complete weekly files with the same year folders and optional task links", () => {
    const records: Activity[] = [
      {
        activity: "walk",
        taskIds: [],
        log: [{ start: "2025-12-29 10:00:00", end: "2026-01-05 10:00:00" }],
        details: { keep: true },
      },
      {
        activity: "task",
        taskIds: ["linked"],
        log: [{ start: "2026-01-04 10:00:00" }],
      },
      {
        activity: "walk",
        taskIds: [],
        log: [{ start: "2026-01-05 10:00:00" }],
      },
    ];
    const files = createActivityWeekFiles(records, yaml);
    expect(files.map(({ path, filename }) => ({ path, filename }))).toEqual([
      {
        path: "_Planner/activities/2026/2026-W01.yaml",
        filename: "2026-W01.yaml",
      },
      {
        path: "_Planner/activities/2026/2026-W02.yaml",
        filename: "2026-W02.yaml",
      },
    ]);
    expect(files[0].contents).toContain("taskIds: []");
    expect(readActivityFile(files[0].contents, yaml)).toEqual(
      records.slice(0, 2),
    );
    expect(readActivityFile(files[1].contents, yaml)).toEqual(records.slice(2));
    expect(() =>
      createActivityWeekFiles(
        [{ activity: "broken", taskIds: [], log: [] }],
        yaml,
      ),
    ).toThrow('Activity "broken" has no valid start time');
  });

  it("uses the same resource names for live metadata and imported metadata snapshots", () => {
    const fields = getActivityAttributeFields("read", "start");
    const resources = [
      readResourceFile(
        "Zulu.md",
        "---\ntags: ['#BOOK']\nstatus: Backlog\n---\n#book\n`#game`\n",
        yaml,
      ),
      { name: "alpha", frontmatter: { alias: "  Alias  " }, tags: ["#book"] },
      { name: "Done", frontmatter: { tag: "book", status: " COMPLETE " } },
      { name: "Other", frontmatter: { tags: ["game"] } },
      { name: "Zulu", frontmatter: { tag: "book" } },
    ];
    expect(getResourceNamesByFieldKey(fields, resources)).toEqual({
      book: ["alpha", "Zulu"],
    });
    expect(getResourceNamesByFieldKey(fields, [])).toEqual({});
    expect(getResourceAliases(resources[1].frontmatter)).toEqual(["Alias"]);
  });

  it("initializes and compares form values consistently across both renderers", () => {
    const initial = getInitialActivityValues(
      getActivityAttributeFields("read", "start"),
      { book: "Example", "start-page": 0, irrelevant: "Ignored" },
    );
    expect(initial).toEqual({ book: "Example", "start-page": "0" });
    expect(hasActivityFormChanges(initial, { ...initial })).toBe(false);
    expect(
      hasActivityFormChanges(initial, { ...initial, book: "Example " }),
    ).toBe(true);
    expect(
      hasActivityFormChanges(initial, { book: "Example", "start-page": "" }),
    ).toBe(true);
  });
});
