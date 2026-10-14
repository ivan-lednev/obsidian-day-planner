import { getOpenActivityLog } from "./activity-open-clock";
import { activitySchema, type Activity } from "./activity-schema";
import {
  activitiesFolder,
  activitiesPathFor,
  getActivityStart,
  readActivityFile,
  writeActivityFile,
  type ActivityYamlCodec,
} from "./activity-storage";
import {
  finishActivityRecord,
  mergeActivityDetails,
  type ActivityValues,
} from "./activity-workflow";

/** Paths are relative to the vault root. Records live exclusively in vault files. */
export interface ActivityFileStore {
  listFiles(): Promise<string[]>;
  readFile(path: string): Promise<string | null>;
  /** Create parent folders. Reject if the contents changed since they were read. */
  writeFile(
    path: string,
    contents: string,
    expected: string | null,
  ): Promise<void>;
}

export interface StoredActivity {
  id: string;
  path: string;
  activityIndex: number;
  record: Activity;
}

// Exclude mutable attributes/end times so notes and completion don't change identity.
// Matching the log starts also prevents an old notification from editing a new row.
export function storedActivityId(path: string, record: Activity) {
  return JSON.stringify([
    path,
    record.activity,
    record.log!.map(({ start }) => start),
  ]);
}

/** Parse a file snapshot so a reload's records and change detection agree. */
export function readStoredActivities(
  files: Iterable<readonly [string, string]>,
  yaml: ActivityYamlCodec,
): StoredActivity[] {
  const result: StoredActivity[] = [];
  for (const [path, contents] of files) {
    if (!path.startsWith(`${activitiesFolder}/`) || !path.endsWith(".yaml"))
      continue;
    readActivityFile(contents, yaml).forEach((record, activityIndex) => {
      getActivityStart(record);
      result.push({
        id: storedActivityId(path, record),
        path,
        activityIndex,
        record,
      });
    });
  }
  return result;
}

export class ActivityRepository {
  constructor(
    readonly files: ActivityFileStore,
    private readonly yaml: ActivityYamlCodec,
  ) {}

  async readActivities(path: string) {
    const contents = await this.files.readFile(path);
    return {
      contents,
      records: contents === null ? [] : readActivityFile(contents, this.yaml),
    };
  }

  async getActivities(): Promise<StoredActivity[]> {
    const files = new Map<string, string>();
    for (const path of await this.files.listFiles()) {
      if (!path.startsWith(`${activitiesFolder}/`) || !path.endsWith(".yaml"))
        continue;
      const contents = await this.files.readFile(path);
      if (contents !== null) files.set(path, contents);
    }
    return readStoredActivities(files, this.yaml);
  }

  async addActivity(input: Activity): Promise<StoredActivity> {
    const record = activitySchema.parse(input);
    const path = activitiesPathFor(getActivityStart(record));
    let activityIndex = 0;
    await this.updateActivities(path, (records) => {
      activityIndex = records.length;
      return [...records, record];
    });
    return { id: storedActivityId(path, record), path, activityIndex, record };
  }

  async updateActivity(id: string, update: (record: Activity) => Activity) {
    const reference: unknown = JSON.parse(id);
    if (
      !Array.isArray(reference) ||
      typeof reference[0] !== "string" ||
      !reference[0].startsWith(`${activitiesFolder}/`)
    )
      throw new Error("Invalid activity reference");
    let updated: Activity | undefined;
    await this.updateActivities(reference[0], (records) => {
      const matches = records.flatMap((record, index) =>
        storedActivityId(reference[0], record) === id ? [index] : [],
      );
      if (matches.length !== 1)
        throw new Error(
          "The activity changed or is ambiguous. Refresh and select it again.",
        );
      updated = activitySchema.parse(update(records[matches[0]]));
      return records.with(matches[0], updated);
    });
    return updated!;
  }

  async finishActivity(
    id: string,
    values: ActivityValues,
    expectedStart?: string,
    endedAt: number | string = Date.now(),
  ) {
    return this.updateActivity(id, (record) =>
      finishActivityRecord(record, values, endedAt, expectedStart),
    );
  }

  async appendActivityNote(id: string, note: string) {
    const text = note.trim();
    if (!text) throw new Error("Note is empty");
    return this.updateActivity(id, (record) => {
      if (!getOpenActivityLog(record))
        throw new Error("There is no open clock");
      return mergeActivityDetails(record, { notes: text });
    });
  }

  async updateActivities(
    path: string,
    update: (records: Activity[]) => Activity[],
  ) {
    if (!path.startsWith(`${activitiesFolder}/`) || !path.endsWith(".yaml"))
      throw new Error(
        "Activity files must be in the vault's activities folder",
      );
    const source = await this.readActivities(path);
    const records = update(source.records).map((record) =>
      activitySchema.parse(record),
    );
    const destinations = new Map<string, Activity[]>([[path, []]]);
    for (const record of records) {
      const destination = activitiesPathFor(getActivityStart(record));
      destinations.set(destination, [
        ...(destinations.get(destination) ?? []),
        record,
      ]);
    }
    // Read every destination before writing so invalid destination YAML cannot lose a row.
    const writes: {
      path: string;
      contents: string;
      expected: string | null;
    }[] = [];
    for (const [destination, moved] of destinations) {
      const previous =
        destination === path ? source : await this.readActivities(destination);
      writes.push({
        path: destination,
        contents: writeActivityFile(
          destination === path ? moved : [...previous.records, ...moved],
          this.yaml,
        ),
        expected: previous.contents,
      });
    }
    // Copy moved rows first. Cross-file moves cannot be atomic on all document providers.
    for (const write of [...writes.slice(1), writes[0]])
      await this.files.writeFile(write.path, write.contents, write.expected);
  }
}
