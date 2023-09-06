import moment from "moment";
import { get } from "svelte/store";

import { SETTINGS_FOR_TESTS } from "../../settings";
import { currentTime } from "../current-time";

import { createSettings } from "./create-settings";
import { createTask } from "./create-task";

const planItem = {
  listTokens: "- ",
  startTime: moment("2023-01-01"),
  endTime: moment("2023-01-01"),
  startMinutes: 10 * 60,
  endMinutes: 11 * 60,
  // todo: this should be derived
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

test("derives task offset from settings and time", () => {
  const settings = createSettings(SETTINGS_FOR_TESTS);
  const { offset, height, relationToNow } = createTask(planItem, {
    settings,
    currentTime,
  });

  expect(get(offset)).toEqual(8 * 60);
  expect(get(height)).toEqual(2 * 60);
  expect(get(relationToNow)).toEqual("past");
});

test("tasks change position and size when zoom level changes", () => {
  const settings = createSettings(SETTINGS_FOR_TESTS);
  const { offset, height } = createTask(planItem, {
    settings,
    currentTime,
  });

  settings.settings.update((previous) => ({ ...previous, zoomLevel: 1 }));

  expect(get(offset)).toEqual(4 * 60);
  expect(get(height)).toEqual(60);
});

test.todo("while dragging, offset is derived from pointer position");

test.todo("while resizing, height is derived from pointer position");

// settings
