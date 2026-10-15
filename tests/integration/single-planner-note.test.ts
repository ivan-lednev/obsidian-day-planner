import { describe, expect, test } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { EditMode } from "../../src/ui/hooks/use-edit/types";

import { setUp } from "./util/setup";

const plannerNotePath = "fixtures/fixture-vault/tasks.md";

describe("Single planner note", () => {
  test("Appends plans for different days to one note and undoes the last append", async () => {
    const { editContext, moveCursorTo, vault, transactionWriter } = await setUp(
      {
        visibleDays: ["2025-07-19", "2025-07-20"],
        settings: {
          ...defaultSettingsForTests,
          plannerNotePath,
        },
      },
    );
    const original = vault.getAbstractFileByPath(plannerNotePath).contents;
    const dailyNotes = vault.state
      .filter(({ path }) => path !== plannerNotePath)
      .map((file) => ({ ...file }));

    async function createPlan(day: string) {
      moveCursorTo(window.moment(`${day} 13:00`));
      editContext.startCreate();
      moveCursorTo(window.moment(`${day} 14:00`));
      await editContext.confirmEdit();
    }

    await createPlan("2025-07-19");
    const afterFirstAppend =
      vault.getAbstractFileByPath(plannerNotePath).contents;
    expect(afterFirstAppend).toContain(original.trim());
    expect(afterFirstAppend).toContain(
      "13:00 - 14:00 Text input ⏳ 2025-07-19",
    );

    await createPlan("2025-07-20");
    const afterSecondAppend =
      vault.getAbstractFileByPath(plannerNotePath).contents;
    expect(afterSecondAppend).toContain(
      "13:00 - 14:00 Text input ⏳ 2025-07-19",
    );
    expect(afterSecondAppend).toContain(
      "13:00 - 14:00 Text input ⏳ 2025-07-20",
    );
    expect(vault.state.filter(({ path }) => path !== plannerNotePath)).toEqual(
      dailyNotes,
    );

    await transactionWriter.undo();
    expect(vault.getAbstractFileByPath(plannerNotePath).contents).toBe(
      afterFirstAppend,
    );
  });

  test("Moves a daily-note task into the shared note with an explicit date", async () => {
    const { editContext, moveCursorTo, vault, findByText } = await setUp({
      visibleDays: ["2025-07-19", "2025-07-20"],
      settings: {
        ...defaultSettingsForTests,
        plannerNotePath,
      },
    });

    editContext.startEdit({
      timeBlock: findByText("List item under planner heading"),
      mode: EditMode.DRAG,
    });
    moveCursorTo(window.moment("2025-07-20 17:00"));
    await editContext.confirmEdit();

    expect(vault.getAbstractFileByPath(plannerNotePath).contents).toMatch(
      /17:00.*List item under planner heading.*⏳ 2025-07-20/,
    );
  });

  test("Keeps an existing shared-note task in its file when moved to another day", async () => {
    const { editContext, moveCursorTo, vault, findByText } = await setUp({
      visibleDays: ["2025-07-19", "2025-07-20"],
      settings: {
        ...defaultSettingsForTests,
        plannerNotePath,
      },
    });
    const task = findByText("Task with time");
    const originalFileCount = vault.state.length;

    editContext.startEdit({ timeBlock: task, mode: EditMode.DRAG });
    moveCursorTo(window.moment("2025-07-20 13:00"));
    await editContext.confirmEdit();

    expect(vault.getAbstractFileByPath(plannerNotePath).contents).toMatch(
      /13:00.*Task with time.*⏳ 2025-07-20/,
    );
    expect(vault.state).toHaveLength(originalFileCount);
  });

  test("Preserves dates for nested tasks when moving a subtree into the shared note", async () => {
    const { editContext, moveCursorTo, vault, findByText } = await setUp({
      visibleDays: ["2025-07-28"],
      settings: { ...defaultSettingsForTests, plannerNotePath },
    });

    editContext.startEdit({
      timeBlock: findByText("Parent"),
      mode: EditMode.DRAG,
    });
    moveCursorTo(window.moment("2025-07-19 10:00"));
    await editContext.confirmEdit();

    const contents = vault.getAbstractFileByPath(plannerNotePath).contents;
    expect(contents).toContain("Parent ⏳ 2025-07-19");
    expect(contents).toContain("Child task ⏳ 2025-07-19");
    expect(contents).toContain("Child list item without time");
    expect(contents).not.toContain("Child list item without time ⏳");
  });
});
