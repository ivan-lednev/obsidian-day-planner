import moment, { type Moment } from "moment";
import type { Vault } from "obsidian";
import {
  getDailyNoteSettings,
  getDateFromPath,
} from "obsidian-daily-notes-interface";
import { vi, test, expect, describe } from "vitest";

import { defaultDayFormat } from "../src/constants";
import { sortListsRecursivelyUnderHeading } from "../src/mdast/mdast";
import {
  applyScopedUpdates,
  createTransaction,
  TransactionWriter,
} from "../src/service/diff-writer";
import { VaultFacade } from "../src/service/vault-facade";
import { defaultSettingsForTests } from "../src/settings";
import type { LocalTask, WithTime } from "../src/task-types";
import { toMinutes } from "../src/util/moment";
import { createTask } from "../src/util/task-utils";
import { type Diff, mapTaskDiffToUpdates } from "../src/util/tasks-utils";

import {
  createInMemoryFile,
  type InMemoryFile,
  InMemoryVault,
} from "./test-utils";

vi.mock("obsidian-daily-notes-interface", () => ({
  getDateFromPath: vi.fn(() => null),
  getDailyNoteSettings: vi.fn(() => ({
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
  // todo: remove test tautology
  const transaction = createTransaction({
    updates,
    settings: defaultSettingsForTests,
    afterEach: (contents: string) =>
      applyScopedUpdates(
        contents,
        defaultSettingsForTests.plannerHeading,
        (scoped) =>
          sortListsRecursivelyUnderHeading(
            scoped,
            // todo: remove heading
            defaultSettingsForTests.plannerHeading,
          ),
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
    vi.mocked(getDailyNoteSettings).mockReturnValue({});

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
          text: "- Updated task",
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
          text: "- Updated subtask",
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
- Updated task
  Text
    - Updated subtask
      Text
- After
`);
  });

  test("Moves tasks in daily notes between files", async () => {
    const todayKey = "2023-01-01";
    const todayDailyNotePath = `${todayKey}.md`;
    const todayMoment = moment(todayKey);

    const tomorrowKey = "2023-01-02";
    const tomorrowDailynotePath = `${tomorrowKey}.md`;
    const tomorrowMoment = moment(tomorrowKey);

    vi.mocked(getDailyNoteSettings).mockReturnValue({
      format: defaultDayFormat,
      folder: ".",
    });
    vi.mocked(getDateFromPath).mockReturnValue(todayMoment);

    const files = [
      createInMemoryFile({
        path: todayDailyNotePath,
        contents: `- Moved`,
      }),
      createInMemoryFile({
        path: tomorrowDailynotePath,
        contents: `# Day planner

- Other
`,
      }),
    ];

    const diff = {
      updated: [
        createTestTask({
          location: {
            path: todayDailyNotePath,
            position: {
              start: { line: 0, col: 0, offset: -1 },
              end: { line: 0, col: 7, offset: -1 },
            },
          },
          text: "- Moved",
          day: tomorrowMoment,
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files });

    expect(vault.getAbstractFileByPath(todayDailyNotePath).contents).toBe("");
    expect(vault.getAbstractFileByPath(tomorrowDailynotePath).contents)
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

  test("Does not change invalid markdown (e.g. occurring in template files) outside planner section", async () => {
    const files = [
      createInMemoryFile({
        path: "2023-01-01.md",
        contents: `# Dreams

- 

# Day planner
`,
      }),
    ];

    const diff = {
      created: [
        createTestTask({
          text: "- Task",
          day: moment("2023-01-01"),
          startMinutes: toMinutes("11:00"),
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files });

    expect(vault.getAbstractFileByPath("2023-01-01.md").contents).toBe(`# Dreams

- 

# Day planner

- Task
`);
  });

  describe("Sorting by time", () => {
    test("Sorts tasks in plan after edit", async () => {
      vi.mocked(getDailyNoteSettings).mockReturnValue({
        format: defaultDayFormat,
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

    test("Sorts tasks after non-mdast edit", async () => {
      vi.mocked(getDailyNoteSettings).mockReturnValue({
        format: defaultDayFormat,
        folder: ".",
      });

      const files = [
        createInMemoryFile({
          path: "2023-01-01.md",
          contents: `# Day planner

- 12:00 - 13:00 Task 3
- 10:00 - 11:00 Task 1
`,
        }),
      ];

      const diff = {
        updated: [
          createTestTask({
            text: "- 11:00 - 12:00 Task 2",
            day: moment("2023-01-01"),
            startMinutes: toMinutes("11:00"),
            location: {
              path: "2023-01-01.md",
              position: {
                start: {
                  line: 2,
                  col: 0,
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
        ],
      };

      const { vault } = await writeDiff({ diff, files });

      expect(vault.getAbstractFileByPath("2023-01-01.md").contents)
        .toBe(`# Day planner

- 10:00 - 11:00 Task 1
- 11:00 - 12:00 Task 2
`);
    });
  });
});
