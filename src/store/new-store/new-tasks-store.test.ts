import moment from "moment";
import { get, writable } from "svelte/store";

import { SETTINGS_FOR_TESTS } from "../../settings";
import { currentTime } from "../current-time";

import {
  createPositionedTask,
  createPositionedTasks,
} from "./create-positioned-task";
import { createSettings } from "./create-settings";

function createStubTask() {
  return writable({
    listTokens: "- ",
    startTime: moment("2023-01-01"),
    endTime: moment("2023-01-01"),
    startMinutes: 10 * 60,
    endMinutes: 11 * 60,
    // todo: half of the properties should be getters
    durationMinutes: 60,
    rawStartTime: "",
    rawEndTime: "",
    text: "",
    firstLineText: "",
    location: {
      path: "path",
      line: 0,
    },
    id: "id",
  });
}

const settings = createSettings(SETTINGS_FOR_TESTS);

test("derives task offset from settings and time", () => {
  const cursorOffsetY = writable(0);
  const { offset, height, relationToNow } = createPositionedTask(
    createStubTask(),
    {
      settings,
      currentTime,
      cursorOffsetY,
    },
  );

  expect(get(offset)).toEqual(8 * 60);
  expect(get(height)).toEqual(2 * 60);
  expect(get(relationToNow)).toEqual("past");
});

test("tasks change position and size when zoom level changes", () => {
  const cursorOffsetY = writable(0);
  const { offset, height } = createPositionedTask(createStubTask(), {
    settings,
    currentTime,
    cursorOffsetY,
  });

  settings.settings.update((previous) => ({ ...previous, zoomLevel: 1 }));

  expect(get(offset)).toEqual(4 * 60);
  expect(get(height)).toEqual(60);
});

describe("dragging", () => {
  test("while dragging, offset is derived from pointer position", () => {
    const cursorOffsetY = writable(0);
    const { offset, startMove } = createPositionedTask(createStubTask(), {
      settings,
      currentTime,
      cursorOffsetY,
    });

    startMove();
    cursorOffsetY.set(10);

    expect(get(offset)).toEqual(10);
  });

  test("cancel move resets task position", () => {
    const cursorOffsetY = writable(0);
    const { offset, startMove, cancelMove } = createPositionedTask(
      createStubTask(),
      {
        settings,
        currentTime,
        cursorOffsetY,
      },
    );

    startMove();
    cursorOffsetY.set(10);

    expect(get(offset)).toEqual(10);

    cancelMove();

    expect(get(offset)).toEqual(0);
  });

  test("when drag ends, task updates pos and stops reacting to cursor movement", () => {
    const task = createStubTask();
    const cursorOffsetY = writable(0);
    const { offset, startMove, confirmMove } = createPositionedTask(task, {
      settings,
      currentTime,
      cursorOffsetY,
    });

    startMove();
    cursorOffsetY.set(10);

    confirmMove();

    cursorOffsetY.set(20);

    // todo: is this wrong?
    expect(get(offset)).toEqual(10);
    // todo: where is this magic number coming from?
    expect(get(task).startMinutes).toEqual(365);
  });

  test.todo("tasks snap to round numbers while dragging");
});

test("overlap gets recalculated when updating a task", () => {
  const cursorOffsetY = writable(0);
  const tasks = createPositionedTasks([], {
    settings,
    currentTime,
    cursorOffsetY,
  });
});

test.todo("while resizing, height is derived from pointer position");

test.todo("task height snaps to a round number while resizing");

// settings
