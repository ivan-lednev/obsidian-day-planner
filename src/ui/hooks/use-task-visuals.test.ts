import { get, writable } from "svelte/store";

import { currentTime } from "../../global-store/current-time";
import { settings } from "../../global-store/settings";
import { toMinutes } from "../../util/moment";

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

// todo: use non-default zoom & start hours
test("derives task offset from settings and time", () => {
  const { offset, height, relationToNow } = useTaskVisuals(
    { ...baseTask, startMinutes: toMinutes("13:00") },
    getBaseUseTaskProps(),
  );

  expect(get(offset)).toEqual(840);
  expect(get(height)).toEqual(120);
  expect(get(relationToNow)).toEqual("past");
});

test.skip("tasks change position and size when zoom level changes", () => {
  const { offset, height } = useTaskVisuals(baseTask, getBaseUseTaskProps());

  // todo: this is leaking state to other tests, need to copy settings
  settings.update((previous) => ({
    ...previous,
    zoomLevel: 1,
  }));

  expect(get(offset)).toEqual(4 * 60);
  expect(get(height)).toEqual(60);
});

test.todo(
  "to-be-created tasks (ghost tasks) follow the cursor and snap to round numbers",
);

test.todo("navigates to file on click");
