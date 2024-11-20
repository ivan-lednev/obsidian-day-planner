import moment, { type Moment } from "moment";
import type { Vault } from "obsidian";
import {
  getDailyNoteSettings,
  getDateFromPath,
} from "obsidian-daily-notes-interface";
import { vi, test, expect, describe } from "vitest";

import { defaultDayFormat } from "../src/constants";
import { sortListsRecursivelyInMarkdown } from "../src/mdast/mdast";
import {
  applyScopedUpdates,
  createTransaction,
  mapTaskDiffToUpdates,
  TransactionWriter,
  type ViewDiff,
} from "../src/service/diff-writer";
import { VaultFacade } from "../src/service/vault-facade";
import { defaultSettingsForTests } from "../src/settings";
import type { LocalTask, WithTime } from "../src/task-types";
import { EditMode } from "../src/ui/hooks/use-edit/types";
import { toMinutes } from "../src/util/moment";
import * as t from "../src/util/task-utils";

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
  DEFAULT_DAILY_NOTE_FORMAT: "YYYY-MM-DD",
}));

async function writeDiff(props: {
  diff: ViewDiff;
  files: Array<InMemoryFile>;
  mode: EditMode;
  afterEach?: (contents: string) => string;
}) {
  const { diff, files, mode, afterEach } = props;

  const getTasksApi = () => {
    throw new Error("Can't access tasks API inside tests");
  };

  const vault = new InMemoryVault(files);
  const vaultFacade = new VaultFacade(vault as unknown as Vault, getTasksApi);
  const updates = mapTaskDiffToUpdates(diff, mode, defaultSettingsForTests);
  // todo: remove test tautology
  const transaction = createTransaction({
    updates,
    settings: defaultSettingsForTests,
    afterEach,
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
    status?: string;
  },
) {
  const {
    location,
    startMinutes = 0,
    text = "",
    day = moment(),
    status,
  } = props;
  return t.create({
    settings: { ...defaultSettingsForTests, eventFormatOnCreation: "bullet" },
    day,
    startMinutes,
    text,
    location,
    status,
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

    const { vault } = await writeDiff({ diff, files, mode: EditMode.DRAG });

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

    const { vault } = await writeDiff({ diff, files, mode: EditMode.DRAG });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`- Before
- 00:00 - 00:30 Updated task
  Text
    - 00:00 - 00:30 Updated subtask
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

    const { vault } = await writeDiff({ diff, files, mode: EditMode.DRAG });

    expect(vault.getAbstractFileByPath(todayDailyNotePath).contents).toBe("");
    expect(vault.getAbstractFileByPath(tomorrowDailynotePath).contents)
      .toBe(`# Day planner

- Other
- 00:00 - 00:30 Moved
`);
  });

  test("Creates multi-line tasks", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: "",
      }),
    ];

    const diff = {
      added: [
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

    const { vault } = await writeDiff({ diff, files, mode: EditMode.DRAG });

    expect(vault.getAbstractFileByPath("file-1").contents)
      .toBe(`- 00:00 - 00:30 Task
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
      added: [
        createTestTask({
          text: "- Task",
          day: moment("2023-01-01"),
          startMinutes: toMinutes("11:00"),
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files, mode: EditMode.DRAG });

    expect(vault.getAbstractFileByPath("2023-01-01.md").contents).toBe(`# Dreams

- 

# Day planner

- 11:00 - 11:30 Task
`);
  });

  test("Adds tasks plugin props to tasks", async () => {
    const files = [
      createInMemoryFile({
        path: "tasks.md",
        // todo: add block ID
        contents: `- [ ] Buy milk
- [ ] Listen to music
- [ ] Play bowling
`,
      }),
    ];
    const task = createTestTask({
      status: " ",
      text: "- [ ] Listen to music",
      day: moment("2023-01-01"),
      startMinutes: toMinutes("11:00"),
      location: {
        path: "tasks.md",
        position: {
          start: {
            line: 1,
            col: 0,
            offset: -1,
          },
          end: {
            line: 1,
            col: -1,
            offset: -1,
          },
        },
      },
    });

    const diff = {
      added: [task],
    };

    const { vault } = await writeDiff({
      diff,
      files,
      mode: EditMode.SCHEDULE_SEARCH_RESULT,
    });

    expect(vault.getAbstractFileByPath("tasks.md").contents)
      .toBe(`- [ ] Buy milk
- [ ] 11:00 - 11:30 Listen to music ⏳ 2023-01-01
- [ ] Play bowling
`);
  });

  test("Updates tasks plugin props without duplicating timestamps if moved to same time on another day", async () => {
    const files = [
      createInMemoryFile({
        path: "tasks.md",
        contents: `- [ ] Buy milk
- [ ] 20:00 - 20:30 Listen to music ⏳ 2023-01-01
- [ ] Play bowling
`,
      }),
    ];
    const task = createTestTask({
      status: " ",
      text: "- [ ] 20:00 - 20:30 Listen to music ⏳ 2023-01-01",
      day: moment("2023-01-02"),
      startMinutes: toMinutes("20:00"),
      location: {
        path: "tasks.md",
        position: {
          start: {
            line: 1,
            col: 0,
            offset: -1,
          },
          end: {
            line: 1,
            col: -1,
            offset: -1,
          },
        },
      },
    });

    const diff = {
      added: [task],
    };

    const { vault } = await writeDiff({
      diff,
      files,
      mode: EditMode.SCHEDULE_SEARCH_RESULT,
    });

    expect(vault.getAbstractFileByPath("tasks.md").contents)
      .toBe(`- [ ] Buy milk
- [ ] 20:00 - 20:30 Listen to music ⏳ 2023-01-02
- [ ] Play bowling
`);
  });

  test("Adds a heading to daily notes if there is none", async () => {
    vi.mocked(getDailyNoteSettings).mockReturnValue({
      format: defaultDayFormat,
      folder: ".",
    });

    const files = [
      createInMemoryFile({
        path: "2023-01-01.md",
        contents: "",
      }),
    ];

    const diff = {
      added: [
        createTestTask({
          text: "- 11:00 - 12:00 Task",
          day: moment("2023-01-01"),
          startMinutes: toMinutes("11:00"),
        }),
      ],
    };

    const { vault } = await writeDiff({
      diff,
      files,
      mode: EditMode.DRAG,
    });

    expect(vault.getAbstractFileByPath("2023-01-01.md").contents)
      .toBe(`# Day planner

- 11:00 - 11:30 Task
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
        added: [
          createTestTask({
            text: "- 11:00 - 12:00 Task 2",
            day: moment("2023-01-01"),
            startMinutes: toMinutes("11:00"),
          }),
        ],
      };

      const { vault } = await writeDiff({
        diff,
        files,
        mode: EditMode.DRAG,
        afterEach: (contents: string) =>
          applyScopedUpdates(
            contents,
            defaultSettingsForTests.plannerHeading,
            sortListsRecursivelyInMarkdown,
          ),
      });

      expect(vault.getAbstractFileByPath("2023-01-01.md").contents)
        .toBe(`# Day planner

- 10:00 - 11:00 Task 1
- 11:00 - 11:30 Task 2
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

      const { vault } = await writeDiff({
        diff,
        files,
        mode: EditMode.DRAG,
        afterEach: (contents: string) =>
          applyScopedUpdates(
            contents,
            defaultSettingsForTests.plannerHeading,
            sortListsRecursivelyInMarkdown,
          ),
      });

      expect(vault.getAbstractFileByPath("2023-01-01.md").contents)
        .toBe(`# Day planner

- 10:00 - 11:00 Task 1
- 11:00 - 11:30 Task 2
`);
    });

    test("Skips sorting if day planner heading is not found", async () => {
      vi.mocked(getDailyNoteSettings).mockReturnValue({
        format: defaultDayFormat,
        folder: ".",
      });

      const files = [
        createInMemoryFile({
          path: "2023-01-01.md",
          contents: `- 12:00 - 13:00 Task 2
- 10:00 - 11:00 Task 1
`,
        }),
      ];

      const diff = {
        updated: [
          createTestTask({
            text: "- 11:00 - 11:30 Task 2",
            day: moment("2023-01-01"),
            startMinutes: toMinutes("11:00"),
            location: {
              path: "2023-01-01.md",
              position: {
                start: {
                  line: 0,
                  col: 0,
                  offset: -1,
                },
                end: {
                  line: 1,
                  col: -1,
                  offset: -1,
                },
              },
            },
          }),
        ],
      };

      const { vault } = await writeDiff({
        diff,
        files,
        mode: EditMode.DRAG,
        afterEach: (contents: string) =>
          applyScopedUpdates(
            contents,
            defaultSettingsForTests.plannerHeading,
            sortListsRecursivelyInMarkdown,
          ),
      });

      expect(vault.getAbstractFileByPath("2023-01-01.md").contents)
        .toBe(`- 11:00 - 11:30 Task 2
- 10:00 - 11:00 Task 1
`);
    });
  });
});
