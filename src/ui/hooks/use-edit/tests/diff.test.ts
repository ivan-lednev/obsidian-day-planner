import moment from "moment";

import { baseTask } from "../../test-utils";
import { EditMode } from "../types";

import {
  dayKey,
  emptyTasks,
  nextDayKey,
  unscheduledTask,
} from "./util/fixtures";
import { setUp } from "./util/setup";

jest.mock("obsidian-daily-notes-interface", () => ({
  ...jest.requireActual("obsidian-daily-notes-interface"),
  getDateFromPath(): null {
    return null;
  },
}));

describe("Finding diff before writing updates to files", () => {
  test.todo("Keeps task text in sync");

  test("Finds tasks moved between days", async () => {
    const task = { ...baseTask, text: "- 12:00 - 13:00 Task ⏳ 2023-01-01" };

    const { todayControls, nextDayControls, confirmEdit, props } = setUp({
      tasks: {
        [dayKey]: {
          withTime: [task],
          noTime: [],
        },
        [nextDayKey]: {
          withTime: [],
          noTime: [],
        },
      },
    });

    todayControls.handleGripMouseDown(task, EditMode.DRAG);
    nextDayControls.handleMouseEnter();

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        updated: [
          expect.objectContaining({
            id: baseTask.id,
          }),
        ],
      }),
    );
  });

  test("Finds tasks from daily notes moved between days", async () => {
    const task = { ...baseTask, text: "- 12:00 - 13:00 Task" };

    const { todayControls, nextDayControls, confirmEdit, props } = setUp({
      tasks: {
        [dayKey]: {
          withTime: [task],
          noTime: [],
        },
        [nextDayKey]: {
          withTime: [],
          noTime: [],
        },
      },
    });

    todayControls.handleGripMouseDown(task, EditMode.DRAG);
    nextDayControls.handleMouseEnter();

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        created: [
          expect.objectContaining({
            id: baseTask.id,
          }),
        ],
        deleted: [
          expect.objectContaining({
            id: baseTask.id,
          }),
        ],
      }),
    );
  });

  test("Finds created tasks", async () => {
    const { todayControls, confirmEdit, props } = setUp({
      tasks: emptyTasks,
    });

    todayControls.handleContainerMouseDown();

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        created: [
          expect.objectContaining({ startTime: moment("2023-01-01 00:00") }),
        ],
        updated: [],
      }),
    );
  });

  test("Finds tasks moved within one day", async () => {
    const { todayControls, confirmEdit, props, moveCursorTo } = setUp();

    todayControls.handleGripMouseDown(baseTask, EditMode.DRAG);
    moveCursorTo("2:00");

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        updated: [
          expect.objectContaining({
            startTime: moment("2023-01-01 02:00"),
          }),
        ],
        created: [],
      }),
    );
  });

  test("Finds newly scheduled tasks", async () => {
    const { todayControls, confirmEdit, props, moveCursorTo } = setUp({
      tasks: unscheduledTask,
    });

    todayControls.handleGripMouseDown(baseTask, EditMode.DRAG);
    moveCursorTo("2:00");

    await confirmEdit();

    expect(props.onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        created: [],
        updated: [
          expect.objectContaining({
            startTime: moment("2023-01-01 02:00"),
          }),
        ],
      }),
    );
  });
});
