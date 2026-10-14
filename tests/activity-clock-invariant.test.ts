// @vitest-environment node
import { describe, expect, it } from "vitest";

import { activityYaml } from "../mobile/src/lib/activity-files";
import {
  activitySchema,
  createActivityRecord,
  finishActivityRecord,
  getOpenActivityLog,
  hasOpenActivityClock,
  closeActivityLogEntry,
  cancelOpenClockByActivityIndex,
  readActivityFile,
  writeActivityFile,
  updateActivityLogEntry,
  mergeActivityDetails,
  resolveActivitySelection,
  readStoredActivities,
} from "../src/shared/activity";

const record = {
  activity: "walk",
  log: [
    { start: "2026-10-07 08:00:00", end: "2026-10-07 08:30:00" },
    { start: "2026-10-07 10:00:00" },
  ],
};
const invalid = {
  ...record,
  log: [...record.log, { start: "2026-10-07 11:00:00" }],
};
const message = "An activity can have at most one open clock";

describe("shared single-open-clock invariant", () => {
  it("allows completed history and several independent activities, each with one open clock", () => {
    expect(activitySchema.parse(record)).toEqual(record);
    expect(getOpenActivityLog(record)?.start).toBe("2026-10-07 10:00:00");
    expect(hasOpenActivityClock(record)).toBe(true);
    const other = createActivityRecord("walk", {}, "2026-10-07 11:00:00");
    expect(
      readActivityFile(
        writeActivityFile([record, other], activityYaml),
        activityYaml,
      ),
    ).toHaveLength(2);
    expect(finishActivityRecord(record, {}, "2026-10-07 10:30:00").log).toEqual(
      [
        record.log[0],
        { start: "2026-10-07 10:00:00", end: "2026-10-07 10:30:00" },
      ],
    );
  });

  it("rejects multiple open logs at both file boundaries without silently closing or dropping data", () => {
    const before = structuredClone(invalid);
    expect(() => activitySchema.parse(invalid)).toThrow(message);
    expect(() =>
      readActivityFile(
        activityYaml.stringify({ activities: [invalid] }),
        activityYaml,
      ),
    ).toThrow(message);
    expect(() => writeActivityFile([invalid], activityYaml)).toThrow(message);
    expect(invalid).toEqual(before);
  });

  it("makes all clock mutations reject an invalid activity and prevents reopening a second log", () => {
    expect(() => getOpenActivityLog(invalid)).toThrow(message);
    expect(() => finishActivityRecord(invalid, {})).toThrow(message);
    expect(() => closeActivityLogEntry(invalid, 1)).toThrow(message);
    expect(() =>
      cancelOpenClockByActivityIndex({ activities: [invalid] }, 0),
    ).toThrow(message);
    expect(() =>
      updateActivityLogEntry({ activities: [record] }, 0, 0, {
        end: undefined,
      }),
    ).toThrow(message);
    expect(() => mergeActivityDetails(record, { log: invalid.log })).toThrow(
      message,
    );
  });

  it("shares notification selection and guards a stale clock reference even when another log is open", () => {
    const entries = readStoredActivities(
      [
        [
          "_Planner/activities/2026/2026-W41.yaml",
          activityYaml.stringify([record]),
        ],
      ],
      activityYaml,
    );
    const id = entries[0].id;
    const valid = resolveActivitySelection(entries, {
      finishId: id,
      finishLogStart: record.log[1].start,
    });
    expect(valid.validRequest).toBe(true);
    expect(valid.requestedLog).toEqual(record.log[1]);
    const stale = resolveActivitySelection(entries, {
      finishId: id,
      finishLogStart: record.log[0].start,
    });
    expect(stale.validRequest).toBe(false);
    expect(() =>
      finishActivityRecord(record, {}, Date.now(), record.log[0].start),
    ).toThrow("no longer open");
  });
});
