import { describe, expect, test } from "vitest";

import { defaultSettingsForTests } from "../../src/settings";
import { EditMode } from "../../src/ui/hooks/use-edit/types";
import { getPathToDiff } from "../util/diff";

import { setUp } from "./util/setup";

describe("Editing", () => {
  describe("Daily notes", () => {
    test("Edits tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText("List item under planner heading"),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-19 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Un-schedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText("List item under planner heading"),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Creates tasks", async () => {
      const { editContext, moveCursorTo, vault } = await setUp({
        visibleDays: ["2025-07-19", "2025-07-20"],
      });

      moveCursorTo(window.moment("2025-07-20 13:00"));
      editContext.lanes.plan.startCreate();
      moveCursorTo(window.moment("2025-07-20 14:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Moves a parent task with its nested subtree between notes", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-28"],
        loadedFixtures: ["2025-07-28.md", "2025-07-19.md"],
        settings: {
          ...defaultSettingsForTests,
          sortTasksInPlanAfterEdit: true,
        },
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText("Parent"),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-19 10:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test(`* Moves a nested task with text between notes
* Does not touch invalid markdown
* Undoes the move`, async () => {
      const {
        editContext,
        moveCursorTo,
        vault,
        findByText,
        transactionWriter,
      } = await setUp({
        visibleDays: ["2025-07-28"],
        settings: {
          ...defaultSettingsForTests,
          sortTasksInPlanAfterEdit: true,
        },
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText("Child"),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-20 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();

      await transactionWriter.undo();

      expect(
        Object.keys(getPathToDiff(vault.initialState, vault.state)).length,
      ).toBe(0);
    });
  });

  describe("Obsidian-tasks", () => {
    test("Schedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText("Task without time"),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-19 13:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Unschedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText("Task with time"),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Updates tasks plugin props without duplicating timestamps if moved to same time on another day", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
        loadedFixtures: ["tasks.md"],
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText("Task with time"),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-28 10:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });
  });

  describe("Dataview", () => {
    test.each([
      {
        variant: "brackets",
        label: "Task with Dataview `scheduled` prop in brackets",
      },
      {
        variant: "parens",
        label: "Task with Dataview `scheduled` prop in parens",
      },
    ])("Schedules tasks ($variant)", async ({ label }) => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText(label),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-19 13:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test.each([
      {
        variant: "brackets",
        label: "Task with timestamp and Dataview `scheduled` prop in brackets",
      },
      {
        variant: "parens",
        label: "Task with timestamp and Dataview `scheduled` prop in parens",
      },
    ])("Unschedules tasks ($variant)", async ({ label }) => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.lanes.plan.startEdit({
        timeBlock: findByText(label),
        mode: EditMode.DRAG,
      });

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });
  });
});
