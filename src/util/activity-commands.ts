import {
  ActivityRepository,
  storedActivityId,
  type ActivityFileStore,
} from "./activity-repository";
import {
  activitiesPathFor,
  getActivityStart,
  type ActivityYamlCodec,
} from "./activity-storage";

export interface ActivityWrite {
  path: string;
  contents: string;
  expected: string | null;
}

export interface AppendActivityNoteCommand {
  type: "appendNote";
  id: string;
  note: string;
}

/** Run the actual repository against a file snapshot for native background actions.
 * The platform applies these same compare-and-write requests to its file adapter.
 */
export async function prepareActivityCommand(
  files: Iterable<readonly [string, string]>,
  yaml: ActivityYamlCodec,
  command: AppendActivityNoteCommand,
) {
  const snapshot = new Map(files);
  const writes: ActivityWrite[] = [];
  const store: ActivityFileStore = {
    listFiles: async () => [...snapshot.keys()],
    readFile: async (path) => snapshot.get(path) ?? null,
    writeFile: async (path, contents, expected) => {
      if ((snapshot.get(path) ?? null) !== expected)
        throw new Error("The activity file changed. Refresh and try again.");
      writes.push({ path, contents, expected });
      snapshot.set(path, contents);
    },
  };
  const repository = new ActivityRepository(store, yaml);
  if (command.type !== "appendNote")
    throw new Error("Unsupported activity command");
  const record = await repository.appendActivityNote(command.id, command.note);
  return {
    writes,
    activityId: storedActivityId(
      activitiesPathFor(getActivityStart(record)),
      record,
    ),
  };
}
