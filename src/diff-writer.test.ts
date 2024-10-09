import type { Root } from "mdast";
import moment from "moment";

import { insertListItemUnderHeading } from "./mdast/mdast";
import {
  createTransaction,
  TransactionWriter,
  type Update,
} from "./service/diff-writer";
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

async function writeUpdates(props: {
  vault: InMemoryVault;
  updates: Update[];
}) {
  const { vault, updates } = props;

  const getTasksApi = () => {
    throw new Error("Can't access tasks API inside tests");
  };

  const vaultFacade = new VaultFacade(vault, getTasksApi);
  const writer = new TransactionWriter(vaultFacade);
  const transaction = createTransaction(updates);

  await writer.writeTransaction(transaction);
}

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
  props: Pick<WithTime<LocalTask>, "location"> & { text?: string },
) {
  const { location, text = "" } = props;
  return createTask({
    settings: { ...defaultSettingsForTests, eventFormatOnCreation: "bullet" },
    day: moment(),
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
    const files = [
      createInMemoryFile({
        path: "2023-01-01",
        contents: `- Moved`,
      }),
      createInMemoryFile({
        path: "2023-01-02",
        contents: `# Plan

- Other
`,
      }),
    ];

    const diff = {
      deleted: [
        createTestTask({
          text: "- Moved",
          location: {
            path: "2023-01-01",
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
        }),
      ],
    };

    const { vault } = await writeDiff({ diff, files });

    expect(vault.getAbstractFileByPath("2023-01-01").contents).toBe("");
    expect(vault.getAbstractFileByPath("2023-01-02").contents).toBe(`# Plan

- 00:00 - 00:30 Moved
- Other
`);
  });

  test.todo("Creates multiline tasks and a heading if it's needed");

  test.todo("Sorts tasks in plan after edit");
});

describe("Diff writer", () => {
  test("Deletes multiple entries in a file", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: `line 0
line 1
line 2
line 3
line 4
`,
      }),
    ];

    const updates = [
      {
        type: "deleted",
        path: "file-1",
        range: {
          start: {
            line: 1,
          },
          end: {
            line: 2,
          },
        },
      },
      {
        type: "deleted",
        path: "file-1",
        range: {
          start: {
            line: 3,
          },
          end: {
            line: 4,
          },
        },
      },
    ] satisfies Update[];

    const vault = new InMemoryVault(files);

    await writeUpdates({ vault, updates });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`line 0
line 2
line 4
`);
  });

  test("Updates ranges", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: `line 0
line 1
line 2
`,
      }),
    ];

    const updates = [
      {
        type: "updated",
        path: "file-1",
        range: {
          start: {
            line: 1,
          },
          end: {
            line: 2,
          },
        },
        contents: "line 1 updated",
      },
    ] satisfies Update[];

    const vault = new InMemoryVault(files);

    await writeUpdates({ vault, updates });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`line 0
line 1 updated
line 2
`);
  });

  test("Combines updates with deletes", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: `line 0
line 1
line 2
line 3
line 4
`,
      }),
    ];

    const updates = [
      {
        type: "updated",
        path: "file-1",
        contents: "line 1 updated",
        range: {
          start: {
            line: 1,
          },
          end: {
            line: 2,
          },
        },
      },
      {
        type: "deleted",
        path: "file-1",
        range: {
          start: {
            line: 3,
          },
          end: {
            line: 4,
          },
        },
      },
    ] satisfies Update[];

    const vault = new InMemoryVault(files);

    await writeUpdates({ vault, updates });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`line 0
line 1 updated
line 2
line 4
`);
  });

  test("Works on multiple files", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: `line 0
line 1
line 2
`,
      }),
      createInMemoryFile({
        path: "file-2",
        contents: `line 0
line 1
line 2
`,
      }),
    ];

    const updates = [
      {
        type: "updated",
        path: "file-1",
        contents: "line 1 updated",
        range: {
          start: {
            line: 1,
          },
          end: {
            line: 2,
          },
        },
      },
      {
        type: "deleted",
        path: "file-2",
        range: {
          start: {
            line: 1,
          },
          end: {
            line: 2,
          },
        },
      },
    ] satisfies Update[];

    const vault = new InMemoryVault(files);

    await writeUpdates({ vault, updates });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`line 0
line 1 updated
line 2
`);

    expect(vault.getAbstractFileByPath("file-2").contents).toBe(`line 0
line 2
`);
  });

  test("Appends new entries after a certain line", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: `line 0
line 1
`,
      }),
    ];

    const updates = [
      {
        type: "created",
        path: "file-1",
        contents: "new line",
        target: 2,
      },
    ] satisfies Update[];

    const vault = new InMemoryVault(files);

    await writeUpdates({ vault, updates });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`line 0
line 1
new line
`);
  });

  test("Combines mdast updates with range updates", async () => {
    const files = [
      createInMemoryFile({
        path: "file-1",
        contents: `line 0
line 1
`,
      }),
    ];

    const updates: Update[] = [
      {
        path: "file-1",
        type: "created",
        contents: "new line",
        target: 2,
      },
      {
        path: "file-1",
        type: "mdast",
        updateFn: (root: Root) =>
          insertListItemUnderHeading(root, "Plan", "New task"),
      },
    ];

    const vault = new InMemoryVault(files);

    await writeUpdates({ vault, updates });

    expect(vault.getAbstractFileByPath("file-1").contents).toBe(`line 0
line 1
new line

# Plan

- New task
`);
  });

  test.todo("diff to updates");

  test.todo("If create does not provide line, append to the end");

  test.todo("Reverts changes");
});
