import type { Root } from "mdast";

import { insertListItemUnderHeading } from "./mdast/mdast";
import {
  createTransaction,
  TransactionWriter,
  type Update,
} from "./service/diff-writer";
import { VaultFacade } from "./service/vault-facade";
import { createInMemoryFile, InMemoryVault } from "./test-utils";

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

  test.todo("If create does not provide line, append to the end");

  test.todo("Reverts changes");
});
