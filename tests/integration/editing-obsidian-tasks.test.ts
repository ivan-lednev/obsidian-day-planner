import { describe, expect, test } from "vitest";

import { EditMode } from "../../src/ui/hooks/use-edit/types";
import { getPathToDiff } from "../test-utils";
import { setUp } from "./init-test-system";

describe("Editing - Obsidian-tasks", () => {
  test("Schedules tasks & un-schedules tasks", async () => {
    const { editContext, moveCursorTo, vault, findByText } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    editContext.handlers.handleGripMouseDown(
      await findByText("Task"),
      EditMode.DRAG,
    );

    moveCursorTo(window.moment("2025-07-19 13:00"));

    await editContext.confirmEdit();

    editContext.handlers.handleGripMouseDown(
      await findByText("Task"),
      EditMode.DRAG,
    );

    moveCursorTo(window.moment("2025-07-19"), "date");

    await editContext.confirmEdit();

    expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
  });

  test.todo(
    "Updates tasks plugin props without duplicating timestamps if moved to same time on another day",
  );
});
