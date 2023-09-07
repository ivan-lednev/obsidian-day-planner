import moment from "moment";
import { get, writable } from "svelte/store";

import { currentTime } from "../current-time";
import { settingsWithUtils } from "../settings-with-utils";

import { useTask } from "./use-task";

const basePlanItem = {
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
};

function getBaseUseTaskProps() {
  const cursorOffsetY = writable(0);
  return {
    settings: settingsWithUtils,
    currentTime,
    isGhost: false,
    cursorOffsetY,
    onUpdate: jest.fn(),
    onMouseUp: jest.fn(),
  };
}

test("derives task offset from settings and time", () => {
  const { offset, height, relationToNow } = useTask(
    basePlanItem,
    getBaseUseTaskProps(),
  );

  expect(get(offset)).toEqual(8 * 60);
  expect(get(height)).toEqual(2 * 60);
  expect(get(relationToNow)).toEqual("past");
});

test("tasks change position and size when zoom level changes", () => {
  const { offset, height } = useTask(basePlanItem, getBaseUseTaskProps());

  // todo: this is leaking state to other tests
  settingsWithUtils.settings.update((previous) => ({
    ...previous,
    zoomLevel: 1,
  }));

  expect(get(offset)).toEqual(4 * 60);
  expect(get(height)).toEqual(60);
});

test.todo(
  "to-be-created tasks (ghost tasks) follow the cursor and snap to round numbers",
);

describe("dragging", () => {
  test("while dragging, offset is derived from pointer position", () => {
    const { cursorOffsetY, ...rest } = getBaseUseTaskProps();
    const { offset, startMove } = useTask(basePlanItem, {
      cursorOffsetY,
      ...rest,
    });

    startMove();
    cursorOffsetY.set(10);

    expect(get(offset)).toEqual(10);
  });

  test("cancel move resets task position", () => {
    const { cursorOffsetY, ...rest } = getBaseUseTaskProps();
    const { offset, startMove, cancelMove } = useTask(basePlanItem, {
      cursorOffsetY,
      ...rest,
    });

    startMove();
    cursorOffsetY.set(10);

    expect(get(offset)).toEqual(10);

    cancelMove();

    expect(get(offset)).toEqual(480);
  });

  test("when drag ends, task updates pos and stops reacting to cursor movement", () => {
    const props = getBaseUseTaskProps();
    const { cursorOffsetY, onUpdate } = props;

    const { offset, startMove, confirmMove } = useTask(basePlanItem, props);

    startMove();
    cursorOffsetY.set(10);
    // todo: more assertions here

    confirmMove();

    expect(get(offset)).toEqual(480);
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ startMinutes: 365 }), // todo: where is this magic number coming from?
    );
  });

  test.todo("tasks snap to round numbers while dragging");

  test.todo("does not react to mouse up when dragging");
});

describe("Resizing", () => {
  test("while resizing, height is derived from pointer position", () => {
    const props = getBaseUseTaskProps();
    const { cursorOffsetY } = props;

    const { height, startResize } = useTask(basePlanItem, props);

    startResize();
    cursorOffsetY.set(700);

    expect(get(height)).toEqual(220);
  });

  test("cancel resize resets task height", () => {
    const props = getBaseUseTaskProps();
    const { cursorOffsetY } = props;

    const { height, startResize, cancelResize } = useTask(basePlanItem, props);

    expect(get(height)).toEqual(120);

    startResize();
    cursorOffsetY.set(700);
    cancelResize();

    expect(get(height)).toEqual(120);
  });

  test("when resize ends, task updates and stops reacting to cursor", () => {
    const props = getBaseUseTaskProps();
    const { cursorOffsetY, onUpdate } = props;

    const { height, startResize, confirmResize } = useTask(basePlanItem, props);

    expect(get(height)).toEqual(120);

    startResize();
    cursorOffsetY.set(700);
    confirmResize();

    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ endMinutes: 710 }),
    );
  });

  test.todo("task height snaps to a round number while resizing");
});

test.todo("navigates to file on click");
