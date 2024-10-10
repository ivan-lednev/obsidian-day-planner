import moment, { type Moment } from "moment";
import { getDailyNoteSettings } from "obsidian-daily-notes-interface";

import { createTransaction, TransactionWriter } from "./service/diff-writer";
import { VaultFacade } from "./service/vault-facade";
import { defaultSettingsForTests } from "./settings";
import type { LocalTask, WithTime } from "./task-types";
import {
  createInMemoryFile,
  type InMemoryFile,
  InMemoryVault,
} from "./test-utils";
import { createTask } from "./util/task-utils";
import { type Diff, mapTaskDiffToUpdates } from "./util/tasks-utils";

jest.mock("obsidian-daily-notes-interface", () => ({
  getDateFromPath: jest.fn(() => null),
  getDailyNoteSettings: jest.fn(),
}));

async function writeDiff(props: { diff: Diff; files: Array<InMemoryFile> }) {
  const getTasksApi = () => {
    throw new Error("Can't access tasks API inside tests");
  };

  const { diff, files } = props;
  const vault = new InMemoryVault(files);
  const vaultFacade = new VaultFacade(vault, getTasksApi);
  const updates = mapTaskDiffToUpdates(diff, defaultSettingsForTests);
  const transaction = createTransaction(updates);
  const writer = new TransactionWriter(vaultFacade);

  await writer.writeTransaction(transaction);

  return { vault };
}

function createTestTask(
  props: Pick<WithTime<LocalTask>, "location"> & {
    text?: string;
    day?: Moment;
  },
) {
  const { location, text = "", day = moment() } = props;
  return createTask({
    settings: { ...defaultSettingsForTests, eventFormatOnCreation: "bullet" },
    day,
    startMinutes: 0,
    text,
    location,
  });
}

describe("From diff to vault", () => {
  test("Deletes multiple tasks surrounded by other tasks", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: `- Before
- Task
  Text
    - Subtask
- After
- Another
- Last
`,
      }),
    ];

    const diff = {
      deleted: [
        createTestTask({
          location: {
            path: "file-1",
            position: {
              start: {
                line: 1,
              },
              end: {
                line: 3,
              },
            },
          },
        }),
        createTestTask({
          location: {
            path: "file-1",
            position: {
              start: {
                line: 5,
              },
              end: {
                line: 5,
              },
            },
          },
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`- Before
- After
- Last
`);
  });

  test("Updates nested tasks", async () => {
    jest.mocked(getDailyNoteSettings).mockReturnValue({});

    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: `- Before
- Task
  Text
    - Subtask
      Text
- After
`,
      }),
    ];

    const diff = {
      updated: [
        createTestTask({
          text: "Updated task",
          location: {
            path: "file-1",
            position: {
              start: {
                line: 1,
                col: 0,
              },
              end: {
                line: 4,
              },
            },
          },
        }),
        createTestTask({
          text: "Updated subtask",
          location: {
            path: "file-1",
            position: {
              start: {
                line: 3,
                col: 4,
              },
              end: {
                line: 4,
              },
            },
          },
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`- Before
- 00:00 - 00:30 Updated task
  Text
    - 00:00 - 00:30 Updated subtask
      Text
- After
`);
  });

  test("Moves tasks in daily notes between files", async () => {
    jest.mocked(getDailyNoteSettings).mockReturnValue({
      format: "YYYY-MM-DD",
      folder: ".",
    });

    const files = [
      createInMemoryFile({
        path: "2023-01-01.md",
        contents: `- Moved`,
      }),
      createInMemoryFile({
        path: "2023-01-02.md",
        contents: `# Day planner

- Other
`,
      }),
    ];

    const diff = {
      deleted: [
        createTestTask({
          text: "- Moved",
          location: {
            path: "2023-01-01.md",
            position: {
              start: {
                line: 0,
              },
              end: {
                line: 0,
              },
            },
          },
        }),
      ],
      created: [
        createTestTask({
          text: "- Moved",
          day: moment("2023-01-02"),
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files });

    expect(vault.getAbstractFileByPath("2023-01-01.md").contents).toBe("");
    expect(vault.getAbstractFileByPath("2023-01-02.md").contents)
      .toBe(`# Day planner

- Other
- Moved
`);
  });

  test("Moves updated tasks between daily notes", () => {});

  test.todo("Creates multiline tasks and a heading if it's needed");

  test.todo("Sorts tasks in plan after edit");
});
