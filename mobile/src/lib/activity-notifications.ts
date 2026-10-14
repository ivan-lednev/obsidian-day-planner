import {
  WebPlugin,
  registerPlugin,
  type PluginListenerHandle,
} from "@capacitor/core";
import {
  activitiesFolder,
  type Activity,
  type ActivityFileStore,
} from "../../../src/shared/activity";

export interface ActivityEntry {
  id: string;
  record: Activity;
}
export interface ActiveActivity extends ActivityEntry {
  active: true;
  label: string;
  startedAt: number;
  finishRequested: boolean;
}
export type ActivityState = ActiveActivity | { active: false };
export interface VaultConnection {
  connected: boolean;
  name?: string;
}

export interface VaultFileQuery {
  folder?: string;
  extension?: ".md" | ".yaml";
}

export interface ActivityNotificationsPlugin {
  addListener(
    eventName: "finishRequested",
    listener: () => void,
  ): Promise<PluginListenerHandle>;
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  getConnection(): Promise<VaultConnection>;
  chooseVault(): Promise<VaultConnection>;
  listFiles(options?: VaultFileQuery): Promise<{ paths: string[] }>;
  readFile(options: { path: string }): Promise<{ contents: string | null }>;
  writeFile(options: {
    path: string;
    contents: string;
    expected: string | null;
  }): Promise<void>;
  getActiveActivity(): Promise<{
    active: boolean;
    id?: string;
    finishRequested?: boolean;
    finishId?: string;
    finishLogStart?: string;
  }>;
  selectActivity(options: {
    id: string;
    label: string;
    startedAt: number;
  }): Promise<void>;
  clearSelection(): Promise<void>;
  cancelFinish(options?: { id: string; logStart?: string }): Promise<void>;
}

// Only the directory handle and selection are held here, never activity records.
interface VaultFileHandle {
  kind: "file";
  getFile(): Promise<File>;
  createWritable(): Promise<{
    write(contents: string): Promise<void>;
    close(): Promise<void>;
  }>;
}
interface VaultDirectoryHandle {
  kind: "directory";
  name: string;
  entries(): AsyncIterableIterator<
    [string, VaultFileHandle | VaultDirectoryHandle]
  >;
  getDirectoryHandle(
    name: string,
    options?: { create: boolean },
  ): Promise<VaultDirectoryHandle>;
  getFileHandle(
    name: string,
    options?: { create: boolean },
  ): Promise<VaultFileHandle>;
}

function pathParts(path: string) {
  const parts = path.split("/");
  if (
    parts.some(
      (part) => !part || part === "." || part === ".." || part.includes("\\"),
    )
  )
    throw new Error("Invalid vault path");
  return parts;
}

export class ActivityNotificationsWeb
  extends WebPlugin
  implements ActivityNotificationsPlugin
{
  private directory?: VaultDirectoryHandle;
  private selectedId?: string;
  async requestNotificationPermission() {
    return { granted: false };
  }
  async getConnection() {
    return { connected: !!this.directory, name: this.directory?.name };
  }
  async chooseVault() {
    const picker = (
      window as unknown as {
        showDirectoryPicker?: (options: {
          mode: string;
        }) => Promise<VaultDirectoryHandle>;
      }
    ).showDirectoryPicker;
    if (!picker)
      throw new Error(
        "This browser cannot open a writable vault folder. Use the Android app or a browser with directory access.",
      );
    const directory = await picker.call(window, { mode: "readwrite" });
    if (directory.name === "_Planner")
      throw new Error(
        "Select your vault root, the folder containing _Planner.",
      );
    this.directory = directory;
    this.selectedId = undefined;
    return this.getConnection();
  }
  private root() {
    if (!this.directory)
      throw new Error("Choose your Obsidian vault folder first.");
    return this.directory;
  }
  async listFiles({ folder = "", extension }: VaultFileQuery = {}) {
    const paths: string[] = [];
    async function visit(directory: VaultDirectoryHandle, prefix: string) {
      for await (const [name, handle] of directory.entries()) {
        if (name.startsWith(".")) continue;
        const path = prefix + name;
        if (handle.kind === "directory") await visit(handle, `${path}/`);
        else if (
          extension
            ? path.endsWith(extension)
            : path.endsWith(".md") || path.endsWith(".yaml")
        )
          paths.push(path);
      }
    }
    let directory = this.root();
    if (folder) {
      try {
        for (const part of pathParts(folder))
          directory = await directory.getDirectoryHandle(part);
      } catch (error) {
        if (error instanceof DOMException && error.name === "NotFoundError")
          return { paths };
        throw error;
      }
    }
    await visit(directory, folder ? `${folder}/` : "");
    return { paths };
  }
  async readFile({ path }: { path: string }) {
    let directory = this.root();
    const parts = pathParts(path);
    try {
      for (const part of parts.slice(0, -1))
        directory = await directory.getDirectoryHandle(part);
      return {
        contents: await (
          await (await directory.getFileHandle(parts.at(-1)!)).getFile()
        ).text(),
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotFoundError")
        return { contents: null };
      throw error;
    }
  }
  async writeFile({
    path,
    contents,
    expected,
  }: {
    path: string;
    contents: string;
    expected: string | null;
  }) {
    if (!path.startsWith("_Planner/activities/") || !path.endsWith(".yaml"))
      throw new Error("Only activity YAML files can be written.");
    let directory = this.root();
    const parts = pathParts(path);
    if ((await this.readFile({ path })).contents !== expected)
      throw new Error("The activity file changed. Refresh and try again.");
    for (const part of parts.slice(0, -1))
      directory = await directory.getDirectoryHandle(part, { create: true });
    const stream = await (
      await directory.getFileHandle(parts.at(-1)!, { create: true })
    ).createWritable();
    await stream.write(contents);
    await stream.close();
  }
  async getActiveActivity() {
    return {
      active: !!this.selectedId,
      id: this.selectedId,
      finishRequested: false,
    };
  }
  async selectActivity({
    id,
  }: {
    id: string;
    label: string;
    startedAt: number;
  }) {
    this.selectedId = id;
  }
  async clearSelection() {
    this.selectedId = undefined;
  }
  async cancelFinish() {}
}

export const ActivityNotifications =
  registerPlugin<ActivityNotificationsPlugin>("ActivityNotifications", {
    web: () => new ActivityNotificationsWeb(),
  });

export const vaultFiles: ActivityFileStore = {
  listFiles: async () =>
    (
      await ActivityNotifications.listFiles({
        folder: activitiesFolder,
        extension: ".yaml",
      })
    ).paths,
  readFile: async (path) =>
    (await ActivityNotifications.readFile({ path })).contents,
  writeFile: (path, contents, expected) =>
    ActivityNotifications.writeFile({ path, contents, expected }),
};
