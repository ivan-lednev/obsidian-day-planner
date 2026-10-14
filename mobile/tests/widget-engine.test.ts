// @vitest-environment node
import { build } from "esbuild";
import { createContext, runInContext } from "node:vm";
import { beforeAll, describe, expect, it } from "vitest";
import { resolve } from "node:path";

let script: string;
beforeAll(async () => {
  const bundle = await build({
    entryPoints: [resolve(import.meta.dirname, "../src/widget-engine.ts")],
    bundle: true,
    platform: "browser",
    format: "iife",
    target: "es2020",
    write: false,
  });
  script = bundle.outputFiles[0].text;
});

function evaluate(contents: string, method = "build") {
  const input = [["_Planner/activities/2026/2026-W41.yaml", contents]];
  const context = createContext({ window: {} });
  const expression =
    script +
    `\nJSON.stringify(window.DayPlannerWidget.${method}(${JSON.stringify(input)},"2026-10-07",new Date("2026-10-07T12:00:00").getTime(),true))`;
  return JSON.parse(runInContext(expression, context, { timeout: 5000 }));
}

describe("offline widget TypeScript bundle", () => {
  it("prepares notification notes through the bundled shared repository with no app running", async () => {
    const contents =
      "activities:\n  - activity: read\n    read: {book: '001'}\n    notes: Existing\n    custom: {string: 'yes', flag: true}\n    log: [{start: '2026-10-07 10:00:00'}]\n";
    const id = JSON.stringify([
      "_Planner/activities/2026/2026-W41.yaml",
      "read",
      ["2026-10-07 10:00:00"],
    ]);
    const context = createContext({ window: {} });
    const result = await runInContext(
      script +
        `\nwindow.DayPlannerWidget.activityCommand(${JSON.stringify([["_Planner/activities/2026/2026-W41.yaml", contents]])},${JSON.stringify({ type: "appendNote", id, note: "\u00a0From notification\uFEFF" })})`,
      context,
    );
    const { writes } = result.model;
    expect(writes).toHaveLength(1);
    expect(writes[0].expected).toBe(contents);
    expect(writes[0].contents).toContain("From notification");
    expect(writes[0].contents).toContain("'001'");
    expect(writes[0].contents).toContain("'yes'");
  });

  it("returns the same single-clock validation error for both widget projections", () => {
    const invalid =
      "activities:\n  - activity: walk\n    log: [{start: '2026-10-07 10:00:00'}, {start: '2026-10-07 11:00:00'}]\n";
    for (const method of ["build", "activeClocks"]) {
      const result = evaluate(invalid, method);
      expect(result.error).toContain("at most one open clock");
      expect(result.model).toBeUndefined();
    }
  });
  it("builds every active clock without restricting starts to today or changing activity identity", () => {
    const result = evaluate(
      "activities:\n  - activity: walk\n    log: [{start: '2026-09-29 10:00:00'}]\n  - activity: walk\n    log: [{start: '2026-10-07 11:00:00'}]\n",
      "activeClocks",
    );
    expect(result.model.clocks).toHaveLength(2);
    expect(JSON.parse(result.model.clocks[0].id)).toEqual([
      "_Planner/activities/2026/2026-W41.yaml",
      "walk",
      ["2026-09-29 10:00:00"],
    ]);
    expect(result.model.clocks[1].startLabel).toBe("11:00");
    expect(evaluate("activities: [unfinished", "activeClocks")).toHaveProperty(
      "error",
    );
  });
  it("parses weekly YAML and lays out a full day without Obsidian or Capacitor globals", () => {
    const result = evaluate(
      "activities:\n  - activity: walk\n    log: [{start: '2026-10-07 10:00:00', end: '2026-10-07 11:00:00'}]\n",
    );
    expect(result.model.hours).toHaveLength(24);
    expect(result.model.blocks[0]).toMatchObject({
      startMinute: 600,
      endMinute: 660,
      durationLabel: "1h",
      placing: { spanPercent: 100 },
    });
  });
  it("treats note and resource text as data, including HTML and quotes", () => {
    const title = '</script><script>alert("no")</script>';
    const result = evaluate(
      JSON.stringify({
        activities: [
          {
            activity: "read",
            read: { book: title },
            notes: title,
            log: [{ start: "2026-10-07 10:00:00" }],
          },
        ],
      }),
    );
    expect(result.model.blocks[0].notes).toBe(title);
    expect(result.model.blocks[0].title).toContain(title);
  });
  it("returns an error instead of a partial model when a synced YAML file is incomplete", () => {
    expect(evaluate("activities: [unfinished")).toHaveProperty("error");
    expect(evaluate("activities: [unfinished")).not.toHaveProperty("model");
  });
});
