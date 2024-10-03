import moment, { type Moment } from "moment";
import { TFile } from "obsidian";

import { icalDayKeyFormat } from "./constants";
import { DiffWriter, type WriterDiff } from "./service/diff-writer";
import { VaultFacade } from "./service/vault-facade";
import { type DayPlannerSettings, defaultSettingsForTests } from "./settings";
import { createTask } from "./util/task-utils";

jest.mock("obsidian-daily-notes-interface", () => ({
  ...jest.requireActual("obsidian-daily-notes-interface"),

  getDateFromPath(): null {
    return null;
  },

  getAllDailyNotes() {
    return [];
  },

  createDailyNote() {
    return createInMemoryFile({ path: "2024-01-01.md", contents: "" });
  },
}));

function createInMemoryFile(props: { path: string; contents: string }) {
  const mockTFile = Object.create(TFile.prototype);

  return Object.assign(mockTFile, { ...props });
}

interface InMemoryFile {
  path: string;
  contents: string;
}

class InMemoryVault {
  constructor(readonly files: Array<InMemoryFile>) {}

  async read(file: TFile) {
    return this.getAbstractFileByPath(file.path).contents;
  }

  async modify(file: TFile, contents: string) {
    const found = this.getAbstractFileByPath(file.path);

    found.contents = contents;
  }

  getAbstractFileByPath(path: string) {
    const found = this.files.find((file) => file.path === path);

    if (!found) {
      throw new Error(`There is no file in the test vault: '${path}'`);
    }

    return found;
  }
}

async function writeDiff(props: {
  diff: WriterDiff;
  vault: InMemoryVault;
  settings?: DayPlannerSettings;
}) {
  const { diff, vault, settings = defaultSettingsForTests } = props;

  const getTasksApi = () => {
    throw new Error("Can't access tasks API inside tests");
  };

  const obsidianFacade = {
    getMetadataForPath: () => ({}),
  };

  const vaultFacade = new VaultFacade(vault, getTasksApi);
  const planEditor = new DiffWriter(
    () => settings,
    obsidianFacade,
    vaultFacade,
  );

  await planEditor.syncTasksWithFile(diff);

  return vault;
}

test("Adds a task with a header to an empty daily note", async () => {
  const vault = new InMemoryVault([
    createInMemoryFile({ path: "2024-01-01.md", contents: "" }),
  ]);

  await writeDiff({
    diff: {
      updated: [],
      created: [
        createTask({
          text: "- New item",
          day: moment("2024-01-01"),
          startMinutes: 0,
          settings: defaultSettingsForTests,
        }),
      ],
      moved: [],
    },
    vault,
  });

  expect(vault.getAbstractFileByPath("2024-01-01.md").contents)
    .toContain(`# Day planner

- New item`);
});

test("Moves a task between daily notes", async () => {
  const files = [
    createInMemoryFile({
      path: "2024-01-01.md",
      contents: `# Day planner

- I've been moved
    - More stuff
`,
    }),
    createInMemoryFile({ path: "2024-01-02.md", contents: "" }),
  ];

  const vault = new InMemoryVault(files);

  jest.requireMock("obsidian-daily-notes-interface").getDailyNote = (
    day: Moment,
  ) => vault.getAbstractFileByPath(`${day.format(icalDayKeyFormat)}.md`);

  await writeDiff({
    diff: {
      updated: [],
      created: [],
      moved: [
        {
          dayKey: "2024-01-02",
          task: createTask({
            text: `- [ ] I've been moved
    - More stuff
`,
            day: moment("2024-01-01"),
            startMinutes: 0,
            settings: defaultSettingsForTests,
            location: {
              path: "2024-01-01.md",
              position: {
                start: {
                  offset: -1,
                  line: 2,
                  col: -1,
                },
                end: {
                  offset: -1,
                  line: 2,
                  col: -1,
                },
              },
            },
          }),
        },
      ],
    },
    vault,
  });

  // todo: fix extra-newline
  expect(vault.getAbstractFileByPath("2024-01-01.md").contents)
    .toBe(`# Day planner

`);

  expect(vault.getAbstractFileByPath("2024-01-02.md").contents)
    .toContain(`# Day planner

- [ ] 00:00 - 00:30 I've been moved
    - More stuff`);
});

// todo: this logic is outside of the diff writer for now
test.skip("Updates scheduled property and does not remove other metadata", async () => {
  const contents = `- [ ] 10:00 - 12:00 Task 🛫 2024-10-01 ⏳ 2024-01-01 📅 2024-10-01`;
  const files = [
    createInMemoryFile({
      path: "tasks.md",
      contents,
    }),
  ];

  const vault = new InMemoryVault(files);

  await writeDiff({
    vault,
    diff: {
      updated: [
        createTask({
          text: contents,
          day: moment("2024-01-02"),
          startMinutes: 0,
          settings: defaultSettingsForTests,
          location: {
            path: "tasks.md",
            position: {
              start: {
                offset: 0,
                line: 0,
                col: 0,
              },
              end: {
                offset: -1,
                line: -1,
                col: -1,
              },
            },
          },
        }),
      ],
      created: [],
      moved: [],
    },
  });

  expect(vault.getAbstractFileByPath("tasks.md").contents).toBe(
    `- [ ] 10:00 - 12:00 Task 🛫 2024-10-01 ⏳ 2024-01-02 📅 2024-10-01`,
  );
});

test.todo("Handles newlines in empty files");

// todo: is this outside DiffWriter?
test.todo("Updates task timestamps");

test.todo("Asks for confirmation before creating files");
