import { get } from "svelte/store";
import { describe, expect, test } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { EditMode } from "../../src/ui/hooks/use-edit/types";
import { getPathToDiff } from "../test-utils";
import { setUp } from "./init-test-system";

describe("Editing - Daily notes", () => {
  test("Edits tasks", async () => {
    const { editContext, moveCursorTo, vault, findByText } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    editContext.handlers.handleGripMouseDown(
      await findByText("List item under planner heading"),
      EditMode.DRAG,
    );

    moveCursorTo(window.moment("2025-07-19 17:00"));

    await editContext.confirmEdit();

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Un-schedules tasks", async () => {
    const { editContext, moveCursorTo, vault, findByText } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    editContext.handlers.handleGripMouseDown(
      await findByText("List item under planner heading"),
      EditMode.DRAG,
    );

    moveCursorTo(window.moment("2025-07-19"), "date");

    await editContext.confirmEdit();

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test("Creates tasks", async () => {
    const { editContext, moveCursorTo, vault } = await setUp({
      visibleDays: ["2025-07-19", "2025-07-20"],
    });

    moveCursorTo(window.moment("2025-07-20 13:00"));
    editContext.handlers.handleContainerMouseDown();
    moveCursorTo(window.moment("2025-07-20 14:00"));

    await editContext.confirmEdit();

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test(`* Moves a nested task with text between notes
* Does not touch invalid markdown
* Undoes the move`, async () => {
    const { editContext, moveCursorTo, vault, findByText, transactionWriter } =
      await setUp({
        visibleDays: ["2025-07-28"],
        settings: {
          ...defaultSettingsForTests,
          sortTasksInPlanAfterEdit: true,
        },
      });

    editContext.handlers.handleGripMouseDown(
      await findByText("Child"),
      EditMode.DRAG,
    );

    moveCursorTo(window.moment("2025-07-20 17:00"));

    await editContext.confirmEdit();

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();

    await transactionWriter.undo();

    expect(
      Object.keys(getPathToDiff(vault.initialState, vault.state)).length,
    ).toBe(0);
  });

  describe("Sorting by time", () => {
    test.todo("Sorts tasks after non-mdast edit");

    test.todo("Skips sorting if day planner heading is not found");
  });
});
