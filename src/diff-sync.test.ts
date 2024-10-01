import moment from "moment";
import type { TFile } from "obsidian";

import { PlanEditor } from "./service/plan-editor";
import { defaultSettingsForTests } from "./settings";
import { createTask } from "./util/task-utils";

class InMemoryVault {
  constructor(readonly files: Record<string, string>) {}

  async read(file: TFile) {
    return this.files[file.path];
  }

  async modify(file: TFile, contents: string) {
    this.files[file.path] = contents;
  }

  async getAbstractFileByPath(path: string) {
    const found = this.files[path];

    if (!found) {
      throw new Error(`There is no file in the test vault: '${path}'`);
    }

    return found;
  }
}

test("Removes tasks", async () => {
  const settings = () => defaultSettingsForTests;
  const obsidianFacade = new InMemoryVault({
    "2024-09-26": `# Day planner
- [ ] test`,
  });

  const planEditor = new PlanEditor(settings, obsidianFacade);
  const createdTask = createTask(moment("2024-01-01"), 0, settings());

  await planEditor.syncTasksWithFile({
    updated: [],
    created: [createdTask],
    moved: [],
  });

  expect(obsidianFacade.files["2024-01-01"]).toBe(`
# Day planner

- New item
`);
});

test.todo("Moves a task between daily notes");

test.todo("Adds a task");

test.todo("Updates task timestamps");

test.todo("Updates 'schduled' property");
