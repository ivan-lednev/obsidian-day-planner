import { describe, expect, it } from "vitest";

import { activityYaml } from "../mobile/src/lib/activity-files";
import {
  createActivityRecord,
  readStoredActivities,
} from "../src/shared/activity";
import { buildActivityActiveClocks } from "../src/shared/activity-timeline";
import { getActivityBlockColors } from "../src/util/color";

describe("shared active clock projection", () => {
  it("keeps simultaneous clocks with the same task ID distinct, including clocks from older weeks", () => {
    const first = createActivityRecord(
      "read",
      { book: "First book" },
      "2026-09-29 09:00:00",
    );
    first.taskIds = ["shared-task"];
    first.notes = "From Obsidian";
    first.quality = 8;
    const second = createActivityRecord(
      "read",
      { book: "Second book" },
      "2026-10-07 10:00:00",
    );
    second.taskIds = first.taskIds;
    const done = createActivityRecord("walk", {}, "2026-10-07 08:00:00");
    done.log![0].end = "2026-10-07 08:30:00";
    const entries = readStoredActivities(
      [
        [
          "_Planner/activities/2026/2026-W40.yaml",
          activityYaml.stringify({ activities: [first] }),
        ],
        [
          "_Planner/activities/2026/2026-W41.yaml",
          activityYaml.stringify({ activities: [second, done] }),
        ],
      ],
      activityYaml,
    );
    const { clocks } = buildActivityActiveClocks(entries, true);
    expect(clocks).toHaveLength(2);
    expect(clocks.map(({ id }) => id)).toEqual(
      entries.slice(0, 2).map(({ id }) => id),
    );
    expect(clocks[0]).toMatchObject({
      title: "📖 Read - First book",
      startLabel: "09:00",
      notes: "From Obsidian",
      qualityLabel: "8 😄",
      ...getActivityBlockColors("read", true),
    });
    expect(clocks[1].startedAt).toBe(new Date("2026-10-07T10:00:00").getTime());
  });

  it("shows one open clock alongside completed history for the same activity", () => {
    const record = createActivityRecord("walk", {}, "2026-10-07 08:00:00");
    record.log![0].end = "2026-10-07 08:15:00";
    record.log!.push(
      { start: "2026-10-07 10:00:00", end: "2026-10-07 10:30:00" },
      { start: "2026-10-07 11:00:00" },
    );
    const entries = readStoredActivities(
      [
        [
          "_Planner/activities/2026/2026-W41.yaml",
          activityYaml.stringify([record]),
        ],
      ],
      activityYaml,
    );
    const { clocks } = buildActivityActiveClocks(entries);
    expect(clocks).toHaveLength(1);
    expect(clocks.map(({ startLabel }) => startLabel)).toEqual(["11:00"]);
    expect(clocks.map(({ logStart }) => logStart)).toEqual([
      "2026-10-07 11:00:00",
    ]);
    expect(buildActivityActiveClocks([]).clocks).toEqual([]);
  });
});
