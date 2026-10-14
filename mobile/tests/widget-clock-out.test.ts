import { mount, unmount } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../src/App.svelte";
import { activityYaml } from "../src/lib/activity-files";
import {
  createActivityRecord,
  readStoredActivities,
} from "../../src/shared/activity";

const bridge = vi.hoisted(() => ({
  getConnection: vi.fn(),
  getActiveActivity: vi.fn(),
  selectActivity: vi.fn(),
  clearSelection: vi.fn(),
  cancelFinish: vi.fn(),
  addListener: vi.fn(),
}));
const files = vi.hoisted(() => ({
  listFiles: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));
vi.mock("../src/lib/activity-notifications", () => ({
  ActivityNotifications: bridge,
  vaultFiles: files,
}));
const path = "_Planner/activities/2026/2026-W41.yaml";
let app: ReturnType<typeof mount> | undefined;
let contents: string;
let selectedId: string | undefined;
let finishId: string | undefined;
let finishLogStart: string | undefined;
let requested: () => void;
let ids: string[];
function button(text: string) {
  return [...document.querySelectorAll("button")].find((element) =>
    element.textContent?.includes(text),
  )!;
}
async function render() {
  app = mount(App, { target: document.body });
  await vi.waitFor(() => expect(bridge.selectActivity).toHaveBeenCalled());
}
function input(name: string, value: string) {
  const field = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
    `[name="${name}"]`,
  )!;
  field.value = value;
  field.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("widget clock-out requests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(
      new Date("2026-10-07T12:00:00").getTime(),
    );
    const first = createActivityRecord("walk", {}, "2026-10-07 10:00:00");
    const second = createActivityRecord(
      "read",
      { book: "Requested book", "start-page": 1 },
      "2026-10-07 11:00:00",
    );
    first.taskIds = second.taskIds = ["same-task"];
    contents = activityYaml.stringify({ activities: [first, second] });
    ids = readStoredActivities([[path, contents]], activityYaml).map(
      ({ id }) => id,
    );
    selectedId = ids[0];
    finishId = undefined;
    finishLogStart = undefined;
    bridge.getConnection.mockResolvedValue({ connected: true });
    bridge.getActiveActivity.mockImplementation(async () => ({
      active: !!selectedId,
      id: selectedId,
      finishId,
      finishLogStart,
    }));
    bridge.selectActivity.mockImplementation(async ({ id }) => {
      selectedId = id;
    });
    bridge.cancelFinish.mockImplementation(async (options) => {
      if (
        !options?.id ||
        (options.id === finishId &&
          (!finishLogStart || options.logStart === finishLogStart))
      ) {
        finishId = undefined;
        finishLogStart = undefined;
      }
    });
    bridge.addListener.mockImplementation(async (_event, listener) => {
      requested = listener;
      return { remove: vi.fn() };
    });
    files.listFiles.mockResolvedValue([path]);
    files.readFile.mockImplementation(async () => contents);
    files.writeFile.mockImplementation(async (_path, next, expected) => {
      expect(expected).toBe(contents);
      contents = next;
    });
  });
  afterEach(async () => {
    if (app) await unmount(app);
    app = undefined;
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("opens the requested activity's finish fields on a cold launch with no selected notification", async () => {
    selectedId = undefined;
    finishId = ids[1];
    await render();
    await vi.waitFor(() =>
      expect(document.querySelector('[name="end-page"]')).not.toBeNull(),
    );
    expect(selectedId).toBe(ids[1]);
    expect(document.body.textContent).toContain("Requested book");
    expect(document.querySelector('[name="quality"]')).not.toBeNull();
    expect(document.querySelector('[name="notes"]')).not.toBeNull();
    expect(files.writeFile).not.toHaveBeenCalled();
  });

  it("retargets a running app and saves only the requested activity, preserving remote notes", async () => {
    await render();
    finishId = ids[1];
    requested();
    await vi.waitFor(() =>
      expect(document.querySelector('[name="end-page"]')).not.toBeNull(),
    );
    const records = activityYaml.parse(contents).activities;
    records[1].notes = "Added remotely";
    contents = activityYaml.stringify({ activities: records });
    input("end-page", "25");
    input("quality", "8");
    input("notes", "From widget");
    button("Save").click();
    await vi.waitFor(() => expect(files.writeFile).toHaveBeenCalledTimes(1));
    const saved = activityYaml.parse(contents).activities;
    expect(saved[0].log[0].end).toBeUndefined();
    expect(saved[1]).toMatchObject({
      read: { "end-page": 25 },
      quality: 8,
      notes: "Added remotely\nFrom widget",
    });
    expect(saved[1].log[0].end).toBeDefined();
  });

  it("cancels the form without closing the requested clock", async () => {
    finishId = ids[1];
    await render();
    await vi.waitFor(() => expect(button("Cancel")?.disabled).toBe(false));
    button("Cancel").click();
    await vi.waitFor(() => expect(bridge.cancelFinish).toHaveBeenCalled());
    expect(files.writeFile).not.toHaveBeenCalled();
  });

  it("closes the sole open log after completed history in the same activity", async () => {
    const records = activityYaml.parse(contents).activities;
    records[1].log[0].end = "2026-10-07 11:15:00";
    records[1].log.push({ start: "2026-10-07 11:30:00" });
    contents = activityYaml.stringify({ activities: records });
    ids = readStoredActivities([[path, contents]], activityYaml).map(
      ({ id }) => id,
    );
    finishId = ids[1];
    finishLogStart = "2026-10-07 11:30:00";
    await render();
    await vi.waitFor(() =>
      expect(document.querySelector('[name="end-page"]')).not.toBeNull(),
    );
    input("end-page", "25");
    button("Save").click();
    await vi.waitFor(() => expect(files.writeFile).toHaveBeenCalledTimes(1));
    const saved = activityYaml.parse(contents).activities;
    expect(saved[1].log[0].end).toBe("2026-10-07 11:15:00");
    expect(saved[1].log[1].end).toBeDefined();
  });

  it("rejects a completed requested log even when the same activity has another open log", async () => {
    const records = activityYaml.parse(contents).activities;
    records[1].log.push({
      start: "2026-10-07 11:30:00",
      end: "2026-10-07 11:45:00",
    });
    contents = activityYaml.stringify({ activities: records });
    ids = readStoredActivities([[path, contents]], activityYaml).map(
      ({ id }) => id,
    );
    finishId = ids[1];
    finishLogStart = "2026-10-07 11:30:00";
    await render();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("no longer open"),
    );
    expect(document.querySelector('[name="quality"]')).toBeNull();
    expect(files.writeFile).not.toHaveBeenCalled();
  });

  it("preserves a newer request when the same activity resumes after its save", async () => {
    const records = activityYaml.parse(contents).activities;
    records[1].log.push({
      start: "2026-10-07 11:30:00",
      end: "2026-10-07 11:45:00",
    });
    contents = activityYaml.stringify({ activities: records });
    ids = readStoredActivities([[path, contents]], activityYaml).map(
      ({ id }) => id,
    );
    finishId = ids[1];
    finishLogStart = "2026-10-07 11:00:00";
    await render();
    await vi.waitFor(() =>
      expect(document.querySelector('[name="end-page"]')).not.toBeNull(),
    );
    let release!: () => void;
    files.writeFile.mockImplementationOnce(
      (_path, next) =>
        new Promise<void>((resolve) => {
          contents = next;
          release = resolve;
        }),
    );
    input("end-page", "25");
    button("Save").click();
    await vi.waitFor(() => expect(release).toBeDefined());
    const reopened = activityYaml.parse(contents).activities;
    delete reopened[1].log[1].end;
    contents = activityYaml.stringify({ activities: reopened });
    finishLogStart = "2026-10-07 11:30:00";
    requested();
    release();
    await vi.waitFor(() =>
      expect(
        document.querySelector<HTMLInputElement>('[name="end-page"]')?.value,
      ).toBe(""),
    );
    expect(finishLogStart).toBe("2026-10-07 11:30:00");
  });

  it("rejects a stale widget clock instead of finishing a different open activity", async () => {
    finishId = JSON.stringify([path, "read", ["2026-10-07 09:00:00"]]);
    await render();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain("no longer open"),
    );
    expect(selectedId).toBe(ids[0]);
    expect(document.querySelector('[name="quality"]')).toBeNull();
    expect(files.writeFile).not.toHaveBeenCalled();
  });

  it("handles a widget request arriving while a refresh is already reading files", async () => {
    let release!: () => void;
    bridge.selectActivity.mockImplementationOnce(
      ({ id }) =>
        new Promise<void>((resolve) => {
          selectedId = id;
          release = resolve;
        }),
    );
    app = mount(App, { target: document.body });
    await vi.waitFor(() => expect(release).toBeDefined());
    finishId = ids[1];
    requested();
    release();
    await vi.waitFor(() =>
      expect(document.querySelector('[name="end-page"]')).not.toBeNull(),
    );
    expect(selectedId).toBe(ids[1]);
  });

  it("preserves a newer clock-out request received while saving another finish form", async () => {
    finishId = ids[1];
    await render();
    await vi.waitFor(() =>
      expect(document.querySelector('[name="end-page"]')).not.toBeNull(),
    );
    let release!: () => void;
    files.writeFile.mockImplementationOnce(
      (_path, next) =>
        new Promise<void>((resolve) => {
          contents = next;
          release = resolve;
        }),
    );
    input("end-page", "25");
    button("Save").click();
    await vi.waitFor(() => expect(release).toBeDefined());
    finishId = ids[0];
    requested();
    release();
    await vi.waitFor(() =>
      expect(
        document.querySelector("form")?.parentElement?.querySelector("h2")
          ?.textContent,
      ).toContain("Walk"),
    );
    expect(selectedId).toBe(ids[0]);
    expect(
      activityYaml.parse(contents).activities[0].log[0].end,
    ).toBeUndefined();
  });
});
