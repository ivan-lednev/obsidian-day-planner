import { diffLines } from "diff";
import { groupBy } from "lodash/fp";
import type { Moment } from "moment/moment";
import { type CachedMetadata, TFile } from "obsidian";
import { SListEntry, type STask } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

export function createInMemoryFile(props: { path: string; contents: string }) {
  const mockTFile = Object.create(TFile.prototype);

  return Object.assign(mockTFile, { ...props });
}

export interface InMemoryFile {
  path: string;
  contents: string;
}

export class InMemoryVault {
  readonly initialState: Array<InMemoryFile>;

  constructor(readonly state: Array<InMemoryFile>) {
    this.initialState = this.state.map((it) => ({ ...it }));
  }

  async read(file: TFile) {
    return this.getAbstractFileByPath(file.path).contents;
  }

  async cachedRead(file: TFile) {
    return this.getAbstractFileByPath(file.path).contents;
  }

  async modify(file: TFile, contents: string) {
    const found = this.getAbstractFileByPath(file.path);

    found.contents = contents;
  }

  getFileByPath(path: string) {
    return this.getAbstractFileByPath(path);
  }

  getAbstractFileByPath(path: string) {
    const found = this.state.find((file) => file.path === path);

    isNotVoid(
      found,
      `There is no file in the test vault: '${path}' Available files: ${this.state.map((it) => it.path).join(", ")} `,
    );

    return found;
  }
}

export class FakeDataviewFacade {
  constructor(
    private readonly fixtures: { tasks: STask[]; lists: SListEntry[] },
  ) {}

  async getAllTasksFrom() {
    return this.fixtures.tasks;
  }

  getAllListsFrom(paths: string[]) {
    const pathToListEntries = groupBy((it) => it.path, this.fixtures.lists);

    return paths.flatMap((path) => pathToListEntries[path] || []);
  }
}

export class FakeMetadataCache {
  constructor(private readonly fileCache: Record<string, CachedMetadata>) {}

  getFileCache({ path }: { path: string }) {
    const fileCache = this.fileCache[path];

    isNotVoid(
      fileCache,
      `There is no file cache for path: '${path}'. Available paths: ${Object.keys(this.fileCache).join(", ")}`,
    );

    return fileCache;
  }
}

export class FakeWorkspaceFacade {}

export class FakePeriodicNotes {
  DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";

  constructor(
    private readonly dailyNotes: Array<{
      path: string;
      file: InMemoryFile;
      date: Moment;
    }>,
  ) {}

  getDailyNote(date: Moment) {
    return this.dailyNotes.find((it) => it.date.isSame(date, "day"))?.file;
  }

  getAllDailyNotes() {
    return this.dailyNotes.map((it) => it.file);
  }

  getDateFromPath(path: string, type: "day" | "month" | "year") {
    if (type !== "day") {
      throw new Error("Only day is supported in tests");
    }

    return this.dailyNotes.find((it) => it.path === path)?.date;
  }

  getDailyNoteSettings() {
    return {
      format: "YYYY-MM-DD",
      folder: ".",
    };
  }

  createDailyNotePath(date: Moment) {
    const found = this.dailyNotes.find((it) => it.date.isSame(date, "day"));

    isNotVoid(found);

    return found.path;
  }
}

export function getLineDiff(v1: string, v2: string) {
  return diffLines(v1, v2)
    .reduce<Array<string>>((result, current, index, array) => {
      if (current.added || current.removed) {
        const prefix = current.added ? "+ " : "- ";
        const changed = current.value
          .trimEnd()
          .split("\n")
          .map((line) => prefix + line);

        return result.concat(changed);
      } else if (index !== 0 && index !== array.length - 1) {
        return result.concat("...");
      }

      return result;
    }, [])
    .join("\n");
}

export function getPathToDiff(
  v1: Array<InMemoryFile>,
  v2: Array<InMemoryFile>,
) {
  return v1.reduce<Record<string, string>>((result, current) => {
    const newVersion = v2.find((it) => it.path === current.path);

    isNotVoid(
      newVersion,
      "The file from the original got deleted. This scenario is not supported in tests",
    );

    const changedLines = getLineDiff(current.contents, newVersion.contents);

    if (changedLines.length > 0) {
      result[current.path] = `\n${changedLines}\n`;
    }

    return result;
  }, {});
}
