import moment, { type Moment } from "moment";
import {
  getDailyNoteSettings,
  getDateFromPath,
} from "obsidian-daily-notes-interface";

import { sortListsRecursivelyUnderHeading } from "./mdast/mdast";
import { createTransaction, TransactionWriter } from "./service/diff-writer";
import { VaultFacade } from "./service/vault-facade";
import { defaultSettingsForTests } from "./settings";
import type { LocalTask, WithTime } from "./task-types";
import {
  createInMemoryFile,
  type InMemoryFile,
  InMemoryVault,
} from "./test-utils";
import { toMinutes } from "./util/moment";
import { createTask } from "./util/task-utils";
import { type Diff, mapTaskDiffToUpdates } from "./util/tasks-utils";
import type { Vault } from "obsidian";

jest.mock("obsidian-daily-notes-interface", () => ({
  getDateFromPath: jest.fn(() => null),
  getDailyNoteSettings: jest.fn(() => ({
    format: "YYYY-MM-DD",
    folder: ".",
  })),
}));

async function writeDiff(props: { diff: Diff; files: Array<InMemoryFile> }) {
  const getTasksApi = () => {
    throw new Error("Can't access tasks API inside tests");
  };

  const { diff, files } = props;
  const vault = new InMemoryVault(files);
  const vaultFacade = new VaultFacade(vault as unknown as Vault, getTasksApi);
  const updates = mapTaskDiffToUpdates(diff, defaultSettingsForTests);
  const transaction = createTransaction({
    updates,
    afterEach: (contents: string) =>
      sortListsRecursivelyUnderHeading(
        contents,
        defaultSettingsForTests.plannerHeading,
      ),
  });
  const writer = new TransactionWriter(vaultFacade);

  await writer.writeTransaction(transaction);

  return { vault };
}

function createTestTask(
  props: Pick<WithTime<LocalTask>, "location"> & {
    text?: string;
    day?: Moment;
    startMinutes?: number;
  },
) {
  const { location, startMinutes = 0, text = "", day = moment() } = props;
  return createTask({
    settings: { ...defaultSettingsForTests, eventFormatOnCreation: "bullet" },
    day,
    startMinutes,
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
                col: -1,
                offset: -1,
              },
              end: {
                line: 3,
                col: -1,
                offset: -1,
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
                col: -1,
                offset: -1,
              },
              end: {
                line: 5,
                col: -1,
                offset: -1,
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
          text: "- 00:00 - 00:30 Updated task",
          location: {
            path: "file-1",
            position: {
              start: {
                line: 1,
                col: 0,
                offset: -1,
              },
              end: {
                line: 4,
                col: -1,
                offset: -1,
              },
            },
          },
        }),
        createTestTask({
          text: "- 00:00 - 00:30 Updated subtask",
          location: {
            path: "file-1",
            position: {
              start: {
                line: 3,
                col: 4,
                offset: -1,
              },
              end: {
                line: 4,
                col: -1,
                offset: -1,
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
    jest.mocked(getDateFromPath).mockReturnValue(moment("2023-01-01"));

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
      updated: [
        createTestTask({
          location: {
            path: "2023-01-01.md",
            position: {
              start: { line: 0, col: 0, offset: -1 },
              end: { line: 0, col: 7, offset: -1 },
            },
          },
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

  test("Creates multiline tasks", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: "",
      }),
    ];

    const diff = {
      created: [
        createTestTask({
          text: `- Task
  Text
    - Subtask
      Text`,
          location: {
            path: "file-1",
            position: {
              start: {
                line: 0,
                col: 0,
                offset: -1,
              },
              end: {
                line: 0,
                col: -1,
                offset: -1,
              },
            },
          },
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`- Task
  Text
    - Subtask
      Text
`);
  });

  test("Sorts tasks in plan after edit", async () => {
    jest.mocked(getDailyNoteSettings).mockReturnValue({
      format: "YYYY-MM-DD",
      folder: ".",
    });

    const files = [
      createInMemoryFile({
        path: "2023-01-01.md",
        contents: `# Day planner

- 10:00 - 11:00 Task 1
- 12:00 - 13:00 Task 3
`,
      }),
    ];

    const diff = {
      created: [
        createTestTask({
          text: "- 11:00 - 12:00 Task 2",
          day: moment("2023-01-01"),
          startMinutes: toMinutes("11:00"),
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files });

    expect(vault.getAbstractFileByPath("2023-01-01.md").contents)
      .toBe(`# Day planner

- 10:00 - 11:00 Task 1
- 11:00 - 12:00 Task 2
- 12:00 - 13:00 Task 3
`);
  });
});
