import type { Moment } from "moment/moment";
import { type CachedMetadata, TFile } from "obsidian";
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

export class FakeMetadataCache {
  constructor(private readonly fileCache: Record<string, CachedMetadata>) {}

  getFileCache({ path }: { path: string }) {
    return this.getCache(path);
  }

  getCache(path: string) {
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
