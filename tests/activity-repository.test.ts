import { dump, load, JSON_SCHEMA } from "js-yaml";
import type { App, Vault } from "obsidian";
import { afterEach, describe, expect, it, vi } from "vitest";

import { activityYaml } from "../mobile/src/lib/activity-files";
import { ActivityNotificationsWeb } from "../mobile/src/lib/activity-notifications";
import { ActivityEditor } from "../src/service/activity-editor";
import { PlannerData } from "../src/service/planner-data";
import {
  ActivityRepository,
  createActivityRecord,
  finishActivityRecord,
  getActivitySuggestionsWithHistory,
  readActivityFile,
  getActivityLogEntries,
  type ActivityFileStore,
} from "../src/shared/activity";
import { createClockTaskFromActivity } from "../src/util/clock";
import { getRenderKey } from "../src/util/task-utils";

const dialogs = vi.hoisted(() => ({
  values: vi.fn(),
  confirm: vi.fn(),
  choice: 0,
  shown: [] as string[],
}));
vi.mock("../src/ui/activity-attributes-modal", () => ({
  askForActivityAttributes: dialogs.values,
}));
vi.mock("../src/ui/confirmation-modal", () => ({
  askForConfirmation: dialogs.confirm,
}));
vi.mock("../src/util/with-notice", () => ({ withNotice: (fn: unknown) => fn }));
vi.mock("../src/ui/SingleSuggestModal", () => ({
  SingleSuggestModal: class {
    constructor(
      private readonly props: {
        getSuggestions: (query: string) => { text: string }[];
        onChooseSuggestion: (item: unknown) => void;
        onClose: () => void;
      },
    ) {}
    open() {
      const suggestions = this.props.getSuggestions("");
      dialogs.shown = suggestions.map(({ text }) => text);
      const choice = suggestions[dialogs.choice];
      if (choice) this.props.onChooseSuggestion(choice);
      this.props.onClose();
    }
  },
}));

vi.mock("obsidian", () => ({
  parseYaml: (contents: string) => load(contents, { schema: JSON_SCHEMA }),
  stringifyYaml: dump,
}));

const week = "_Planner/activities/2026/2026-W41.yaml";

function sharedVault() {
  const contents = new Map<string, string>();
  const files: ActivityFileStore = {
    listFiles: async () => [...contents.keys()],
    readFile: async (path) => contents.get(path) ?? null,
    writeFile: async (path, next, expected) => {
      if ((contents.get(path) ?? null) !== expected)
        throw new Error("The activity file changed");
      contents.set(path, next);
    },
  };
  const vault = {
    adapter: {
      exists: async (path: string) =>
        contents.has(path) ||
        [...contents.keys()].some((key) => key.startsWith(`${path}/`)),
      read: async (path: string) => contents.get(path)!,
      write: async (path: string, value: string) => {
        contents.set(path, value);
      },
      list: async (folder: string) => {
        const files: string[] = [];
        const folders = new Set<string>();
        for (const path of contents.keys()) {
          if (!path.startsWith(`${folder}/`)) continue;
          const rest = path.slice(folder.length + 1);
          if (rest.includes("/"))
            folders.add(`${folder}/${rest.split("/")[0]}`);
          else files.push(path);
        }
        return { files, folders: [...folders] };
      },
    },
    getFiles: () =>
      [...contents.keys()].map((path) => ({
        path,
        extension: path.split(".").at(-1),
      })),
    getFileByPath: (path: string) => (contents.has(path) ? { path } : null),
    getAbstractFileByPath: (path: string) =>
      contents.has(path) || !path.includes(".yaml"),
    createFolder: async () => {},
    read: async (file: { path: string }) => contents.get(file.path)!,
    create: async (path: string, value: string) => {
      if (contents.has(path)) throw new Error("File exists");
      contents.set(path, value);
      return { path };
    },
    process: async (file: { path: string }, update: (text: string) => string) =>
      contents.set(file.path, update(contents.get(file.path)!)),
  } as unknown as Vault;
  return {
    contents,
    files,
    plugin: new PlannerData(vault),
    companion: new ActivityRepository(files, activityYaml),
  };
}

describe("one vault backend for the plugin and companion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
    dialogs.values.mockReset();
    dialogs.confirm.mockReset();
    dialogs.choice = 0;
    dialogs.shown = [];
  });
  it("starts in the companion, finishes in the plugin, and uses the same history after reload", async () => {
    const { contents, companion, plugin, files } = sharedVault();
    const record = createActivityRecord(
      "read",
      { book: "Book", "start-page": 1 },
      "2026-10-06 10:00:00",
    );
    await companion.addActivity(record);
    expect([...contents.keys()]).toEqual([week]);
    expect(contents.get(week)).not.toContain("taskIds: []");
    await plugin.loadActivities();
    expect(plugin.getAllActivities()).toEqual([record]);
    await plugin.updateActivities(week, (records) =>
      records.map((entry) =>
        finishActivityRecord(entry, { "end-page": 50 }, "2026-10-06 10:30:00"),
      ),
    );
    const reloaded = await new ActivityRepository(
      files,
      activityYaml,
    ).getActivities();
    expect(reloaded[0].record.log![0].end).toBe("2026-10-06 10:30:00");
    expect(
      getActivitySuggestionsWithHistory(
        reloaded.map(({ record: item }) => item),
      ).find(({ text }) => text === "read - Book")?.initialValues,
    ).toEqual({ book: "Book", "start-page": 51 });
  });

  it("preserves external notes, task links, other rows and attributes when finishing", async () => {
    const { companion, plugin } = sharedVault();
    const first = await companion.addActivity(
      createActivityRecord("walk", {}, "2026-10-06 10:00:00"),
    );
    await plugin.loadActivities();
    await companion.addActivity(
      createActivityRecord("game", { name: "Game" }, "2026-10-06 11:00:00"),
    );
    // The plugin's original cache predates both this second row and the external note.
    await companion.updateActivity(first.id, (record) => ({
      ...record,
      notes: "External note",
      taskIds: ["task"],
      custom: { keep: true },
    }));
    await plugin.updateActivities(week, (records) =>
      records.with(
        0,
        finishActivityRecord(
          records[0],
          { notes: "Finish note" },
          "2026-10-06 11:30:00",
        ),
      ),
    );
    const entries = await companion.getActivities();
    expect(entries).toHaveLength(2);
    expect(entries[0].record).toMatchObject({
      notes: "External note\nFinish note",
      taskIds: ["task"],
      custom: { keep: true },
    });
    expect(entries[1].record.log![0].end).toBeUndefined();
  });

  it("keeps notification references valid after reordering but rejects removed or duplicate identities", async () => {
    const { companion } = sharedVault();
    const first = await companion.addActivity(
      createActivityRecord("walk", {}, "2026-10-06 10:00:00"),
    );
    const second = await companion.addActivity(
      createActivityRecord("walk", {}, "2026-10-06 11:00:00"),
    );
    await companion.updateActivities(week, (records) => records.toReversed());
    await companion.updateActivity(first.id, (record) =>
      finishActivityRecord(record, {}, "2026-10-06 12:00:00"),
    );
    const entries = await companion.getActivities();
    expect(entries[0].id).toBe(second.id);
    expect(entries[0].record.log![0].end).toBeUndefined();
    await companion.updateActivities(week, (records) => [
      records[0],
      records[0],
    ]);
    await expect(
      companion.updateActivity(second.id, (record) => record),
    ).rejects.toThrow("ambiguous");
    await expect(
      companion.updateActivity(first.id, (record) => record),
    ).rejects.toThrow("changed");
  });

  it("rejects conflicting writes without replacing a newer external file", async () => {
    const { companion, files, contents } = sharedVault();
    const entry = await companion.addActivity(
      createActivityRecord("walk", {}, "2026-10-06 10:00:00"),
    );
    const write = files.writeFile;
    files.writeFile = async (path, next, expected) => {
      const latest = readActivityFile(contents.get(path)!, activityYaml);
      latest[0].notes = "Concurrent edit";
      contents.set(path, activityYaml.stringify({ activities: latest }));
      return write(path, next, expected);
    };
    await expect(
      companion.updateActivity(entry.id, (record) =>
        finishActivityRecord(record, {}, "2026-10-06 10:30:00"),
      ),
    ).rejects.toThrow("changed");
    expect((await companion.getActivities())[0].record).toMatchObject({
      notes: "Concurrent edit",
    });
    expect(
      (await companion.getActivities())[0].record.log![0].end,
    ).toBeUndefined();
  });

  it("moves corrected dates to ISO-year folders and appends to the latest destination", async () => {
    const { companion, contents } = sharedVault();
    const record = createActivityRecord("walk", {}, "2026-10-06 10:00:00");
    const entry = await companion.addActivity(record);
    const newYear = "_Planner/activities/2026/2026-W01.yaml";
    const existing = createActivityRecord(
      "game",
      { name: "Game" },
      "2025-12-29 11:00:00",
    );
    await companion.addActivity(existing);
    await companion.updateActivity(entry.id, (item) => ({
      ...item,
      log: [{ start: "2025-12-29 10:00:00" }],
    }));
    expect(readActivityFile(contents.get(week)!, activityYaml)).toEqual([]);
    expect(readActivityFile(contents.get(newYear)!, activityYaml)).toHaveLength(
      2,
    );
    expect(readActivityFile(contents.get(newYear)!, activityYaml)[0]).toEqual(
      existing,
    );
  });

  it("does not use prototype local storage or create a second history database", async () => {
    localStorage.setItem(
      "day-planner.active-activity",
      JSON.stringify({ active: true, id: "old" }),
    );
    const web = new ActivityNotificationsWeb();
    expect(await web.getConnection()).toEqual({
      connected: false,
      name: undefined,
    });
    expect(await web.getActiveActivity()).toMatchObject({ active: false });
    await expect(web.listFiles()).rejects.toThrow("Choose your Obsidian vault");
    expect(localStorage.getItem("day-planner.activity-history")).toBeNull();
    localStorage.clear();
  });

  it("writes and reloads the actual browser directory through the file adapter", async () => {
    const nodes = new Map<string, unknown>();
    function directory(name: string, path = "") {
      return {
        kind: "directory" as const,
        name,
        async *entries() {
          for (const [key, value] of nodes)
            if (key.startsWith(path) && !key.slice(path.length).includes("/"))
              yield [key.slice(path.length), value];
        },
        async getDirectoryHandle(child: string, options?: { create: boolean }) {
          const key = path + child;
          if (!nodes.has(key) && options?.create)
            nodes.set(key, directory(child, key + "/"));
          if (!nodes.has(key))
            throw new DOMException("Missing directory", "NotFoundError");
          return nodes.get(key);
        },
        async getFileHandle(child: string, options?: { create: boolean }) {
          const key = path + child;
          if (!nodes.has(key) && options?.create) {
            let contents = "";
            nodes.set(key, {
              kind: "file",
              getFile: async () => ({ text: async () => contents }),
              createWritable: async () => ({
                write: async (next: string) => {
                  contents = next;
                },
                close: async () => {},
              }),
            });
          }
          if (!nodes.has(key))
            throw new DOMException("Missing file", "NotFoundError");
          return nodes.get(key);
        },
      };
    }
    vi.stubGlobal(
      "showDirectoryPicker",
      vi.fn().mockResolvedValue(directory("Vault")),
    );
    const web = new ActivityNotificationsWeb();
    expect(await web.chooseVault()).toEqual({ connected: true, name: "Vault" });
    const adapter: ActivityFileStore = {
      listFiles: async () => (await web.listFiles()).paths,
      readFile: async (path) => (await web.readFile({ path })).contents,
      writeFile: (path, contents, expected) =>
        web.writeFile({ path, contents, expected }),
    };
    const repository = new ActivityRepository(adapter, activityYaml);
    const record = createActivityRecord("walk", {}, "2026-10-06 10:00:00");
    const entry = await repository.addActivity(record);
    await repository.updateActivity(entry.id, (item) =>
      finishActivityRecord(item, { notes: "Finished" }, "2026-10-06 10:30:00"),
    );
    expect(await adapter.listFiles()).toEqual([week]);
    expect(
      (await new ActivityRepository(adapter, activityYaml).getActivities())[0]
        .record.notes,
    ).toBe("Finished");
    await expect(
      web.writeFile({ path: week, contents: "stale", expected: "old" }),
    ).rejects.toThrow("changed");
    await expect(web.readFile({ path: "../outside.md" })).rejects.toThrow(
      "Invalid vault path",
    );
    expect(localStorage.length).toBe(0);
  });

  it("rejects a plugin update if an external reorder changed the displayed row indices", async () => {
    const { companion, plugin } = sharedVault();
    await companion.addActivity(
      createActivityRecord("walk", {}, "2026-10-06 10:00:00"),
    );
    await companion.addActivity(
      createActivityRecord("game", { name: "Game" }, "2026-10-06 11:00:00"),
    );
    await plugin.loadActivities();
    await companion.updateActivities(week, (records) => records.toReversed());
    await expect(
      plugin.updateActivities(week, (records) =>
        records.with(0, finishActivityRecord(records[0], {})),
      ),
    ).rejects.toThrow("list changed");
    expect(
      (await companion.getActivities()).every(
        ({ record }) => !record.log![0].end,
      ),
    ).toBe(true);
  });

  it("preserves missing and empty taskIds as ordinary YAML metadata", async () => {
    const { companion, contents } = sharedVault();
    const first = await companion.addActivity(
      createActivityRecord("walk", {}, "2026-10-06 10:00:00"),
    );
    const second = await companion.addActivity({
      ...createActivityRecord("walk", {}, "2026-10-06 11:00:00"),
      taskIds: [],
    });
    await companion.updateActivity(first.id, (record) =>
      finishActivityRecord(record, {}, "2026-10-06 10:30:00"),
    );
    const raw = (load(contents.get(week)!) as { activities: unknown[] })
      .activities;
    expect(raw[0]).not.toHaveProperty("taskIds");
    expect(raw[1]).toHaveProperty("taskIds", []);
    expect((await companion.getActivities())[1].id).toBe(second.id);
  });

  it("keeps duplicate activity/log rows visible and finishes the selected row despite shared taskIds", async () => {
    const { companion, plugin } = sharedVault();
    const record = {
      ...createActivityRecord("walk", {}, "2026-10-06 10:00:00"),
      taskIds: ["shared"],
    };
    await companion.addActivity(record);
    await companion.addActivity({ ...record, notes: "Second row" });
    await plugin.loadActivities();
    const blocks = getActivityLogEntries(week, plugin.getAllActivities()).map(
      ({ activity, log, activityLocation }) => ({
        ...createClockTaskFromActivity({
          activity: {
            title: activity.activity,
            location: {
              path: week,
              position: {
                start: { line: 0, col: 0, offset: 0 },
                end: { line: 0, col: 0, offset: 0 },
              },
            },
          },
          clockMoments: [
            window.moment(log.start),
            window.moment(log.start).add(30, "minutes"),
          ],
        }),
        activityLocation,
        clockActivity: { ...activity, log: [log] },
      }),
    );
    expect(new Set(blocks.map(getRenderKey)).size).toBe(2);
    expect(
      blocks.every((block) => !block.taskId && block.location?.path === week),
    ).toBe(true);
    const editor = new ActivityEditor({} as App, plugin);
    dialogs.values.mockResolvedValue({ notes: "Finished second" });
    await editor.finishActivity(blocks[1]);
    const records = plugin.getAllActivities();
    expect(records[0].log![0].end).toBeUndefined();
    expect(records[0].notes).toBeUndefined();
    expect(records[1].log![0].end).toBeDefined();
    expect(records[1].notes).toBe("Second row\nFinished second");
    expect(records.every((item) => item.taskIds?.[0] === "shared")).toBe(true);
    expect(blocks[1].clockActivity.log![0].end).toBeUndefined();
  });

  it("uses the chosen weekly file and log row for global finish, edits, notes and cancellation", async () => {
    const { companion, plugin } = sharedVault();
    await companion.addActivity({
      ...createActivityRecord("walk", {}, "2026-10-06 10:00:00"),
      taskIds: ["shared"],
    });
    const older = {
      ...createActivityRecord("walk", {}, "2026-09-29 10:00:00"),
      taskIds: ["shared"],
      log: [
        { start: "2026-09-29 10:00:00", end: "2026-09-29 10:30:00" },
        { start: "2026-09-29 11:00:00" },
      ],
    };
    await companion.addActivity(older);
    const editor = new ActivityEditor({} as App, plugin);
    // Only the older activity's second log is open; it is the first suggestion.
    dialogs.choice = 0;
    dialogs.values.mockResolvedValue({ notes: "Finish second log" });
    await editor.finishSelectedOpenActivity();
    expect(dialogs.shown).toHaveLength(2);
    const olderPath = "_Planner/activities/2026/2026-W40.yaml";
    const completed = plugin
      .getAllActivities()
      .find((item) => item.log![0].start === older.log[0].start)!;
    expect(completed.log![0].end).toBe("2026-09-29 10:30:00");
    expect(completed.log![1].end).toBeDefined();
    const block = {
      id: "older",
      text: "walk",
      symbol: "-",
      startTime: window.moment(older.log[0].start),
      durationMinutes: 0,
      activityLocation: { path: olderPath, activityIndex: 0, logEntryIndex: 0 },
      clockActivity: { ...completed, log: [completed.log![0]] },
    };
    dialogs.values.mockResolvedValue({ notes: "Another note" });
    await editor.addNoteToClockActivity(block);
    dialogs.values.mockResolvedValue({ start: "2026-09-29 10:15:00" });
    await editor.changeClockActivityStartTime(block);
    const afterEdit = plugin
      .getAllActivities()
      .find((item) => item.log![0].start === "2026-09-29 10:15:00")!;
    expect(afterEdit.notes).toBe("Finish second log\nAnother note");
    // Reopen one earlier session before cancelling it, preserving the finished session.
    await plugin.updateActivities(olderPath, (records) =>
      records.map((record) => ({
        ...record,
        log: record.log!.map((log, index) =>
          index === 0 ? { start: log.start } : log,
        ),
      })),
    );
    const reopened = plugin
      .getAllActivities()
      .find((item) => item.notes === afterEdit.notes)!;
    dialogs.confirm.mockResolvedValue(true);
    await editor.cancelActivity({
      ...block,
      clockActivity: { ...reopened, log: [reopened.log![0]] },
    });
    expect(
      plugin.getAllActivities().find((item) => item.notes === afterEdit.notes)
        ?.log,
    ).toEqual([afterEdit.log![1]]);
    expect(
      plugin
        .getAllActivities()
        .find((item) => item.log![0].start === "2026-10-06 10:00:00")!.log![0]
        .end,
    ).toBeUndefined();
  });
});
