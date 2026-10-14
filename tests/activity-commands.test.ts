// @vitest-environment node
import { describe, expect, it } from "vitest";

import { activityYaml } from "../mobile/src/lib/activity-files";
import {
  ActivityRepository,
  prepareActivityCommand,
  createActivityRecord,
  readStoredActivities,
  readActivityFile,
  type ActivityFileStore,
} from "../src/shared/activity";

const path = "_Planner/activities/2026/2026-W41.yaml";
function fixture() {
  const read = createActivityRecord(
    "read",
    { book: "001", "start-page": 1 },
    "2026-10-07 10:00:00",
  );
  read.notes = "Existing";
  read.quality = 8;
  read.taskIds = ["same-task"];
  read.custom = { string: "yes", number: 5, flag: true };
  const walk = createActivityRecord("walk", {}, "2026-10-07 11:00:00");
  walk.taskIds = read.taskIds;
  const contents = activityYaml.stringify({ activities: [read, walk] });
  const id = readStoredActivities([[path, contents]], activityYaml)[0].id;
  return { read, walk, contents, id };
}

describe("shared background activity commands", () => {
  it("uses the same repository writes and preserves metadata, notes, strings and other rows", async () => {
    const { contents, id } = fixture();
    const input = [[path, contents]] as const;
    const plan = await prepareActivityCommand(input, activityYaml, {
      type: "appendNote",
      id,
      note: "\u00a0During activity\uFEFF",
    });
    const actualWrites: unknown[] = [];
    const store: ActivityFileStore = {
      listFiles: async () => [path],
      readFile: async () => contents,
      writeFile: async (path, contents, expected) => {
        actualWrites.push({ path, contents, expected });
      },
    };
    await new ActivityRepository(store, activityYaml).appendActivityNote(
      id,
      "\u00a0During activity\uFEFF",
    );
    expect(plan.writes).toEqual(actualWrites);
    expect(plan.writes[0].expected).toBe(contents);
    const [read, walk] = readActivityFile(
      plan.writes[0].contents,
      activityYaml,
    );
    expect(read).toMatchObject({
      notes: "Existing\nDuring activity",
      quality: 8,
      taskIds: ["same-task"],
      read: { book: "001", "start-page": 1 },
      custom: { string: "yes", number: 5, flag: true },
    });
    expect(walk).toEqual(fixture().walk);
  });

  it("resolves reordered rows and rejects stale, completed, ambiguous, and malformed records", async () => {
    const { read, walk, id } = fixture();
    const execute = (records: (typeof read)[]) =>
      prepareActivityCommand(
        [[path, activityYaml.stringify({ activities: records })]],
        activityYaml,
        { type: "appendNote", id, note: "Note" },
      );
    const plan = await execute([walk, read]);
    expect(
      readActivityFile(plan.writes[0].contents, activityYaml)[1].notes,
    ).toBe("Existing\nNote");
    await expect(execute([walk])).rejects.toThrow("changed or is ambiguous");
    await expect(
      execute([
        { ...read, log: [{ ...read.log![0], end: "2026-10-07 10:30:00" }] },
      ]),
    ).rejects.toThrow("no open clock");
    await expect(execute([read, read])).rejects.toThrow(
      "changed or is ambiguous",
    );
    await expect(
      execute([
        { ...read, log: [...read.log!, { start: "2026-10-07 11:00:00" }] },
      ]),
    ).rejects.toThrow("at most one open clock");
  });

  it("normalizes legacy planner YAML through the same shared parser and serializer", async () => {
    const contents =
      "planner:\n  activities:\n    - activity: read\n      taskIds: []\n      log: []\n  log: [{start: '2026-10-07 10:00:00'}]\n";
    const id = readStoredActivities([[path, contents]], activityYaml)[0].id;
    const { writes } = await prepareActivityCommand(
      [[path, contents]],
      activityYaml,
      { type: "appendNote", id, note: "Note" },
    );
    expect(writes[0].contents).not.toContain("planner:");
    expect(readActivityFile(writes[0].contents, activityYaml)[0]).toMatchObject(
      { taskIds: [], notes: "Note" },
    );
  });

  it("plans weekly moves and expected-file contents through the repository rather than a native YAML implementation", async () => {
    const older = createActivityRecord("walk", {}, "2026-09-29 10:00:00");
    const input = [[path, activityYaml.stringify([older])]] as const;
    const id = readStoredActivities(input, activityYaml)[0].id;
    const { writes, activityId } = await prepareActivityCommand(
      input,
      activityYaml,
      {
        type: "appendNote",
        id,
        note: "Older clock",
      },
    );
    expect(writes.map(({ path }) => path)).toEqual([
      "_Planner/activities/2026/2026-W40.yaml",
      path,
    ]);
    expect(writes[0].expected).toBeNull();
    expect(JSON.parse(activityId)[0]).toBe(
      "_Planner/activities/2026/2026-W40.yaml",
    );
    expect(readActivityFile(writes[0].contents, activityYaml)[0].notes).toBe(
      "Older clock",
    );
    expect(readActivityFile(writes[1].contents, activityYaml)).toEqual([]);
  });
});
