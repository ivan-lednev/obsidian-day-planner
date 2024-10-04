import moment from "moment";
import { get, writable } from "svelte/store";

import { currentTime } from "../../global-store/current-time";
import { settings } from "../../global-store/settings";

import { baseTask } from "./test-utils";
import { useTaskVisuals } from "./use-task-visuals";

function getBaseUseTaskProps() {
  const cursorOffsetY = writable(0);
  return {
    settings,
    currentTime,
    cursorOffsetY,
    onUpdate: jest.fn(),
    onMouseUp: jest.fn(),
  };
}

test("derives task offset from settings and time", () => {
  const { offset, height } = useTaskVisuals(
    { ...baseTask, startTime: moment("2023-01-01 13:00") },
    getBaseUseTaskProps(),
  );

  expect(get(offset)).toEqual("840px");
  expect(get(height)).toEqual("120px");
});

test.skip("tasks change position and size when zoom level changes", () => {
  const { offset, height } = useTaskVisuals(baseTask, getBaseUseTaskProps());

  // TODO: this is leaking state to other tests, need to copy settings
  settings.update((previous) => ({
    ...previous,
    zoomLevel: 1,
  }));

  expect(get(offset)).toEqual(`${4 * 60}px`);
  expect(get(height)).toEqual("60px");
});
