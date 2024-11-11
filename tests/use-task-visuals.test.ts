import moment from "moment";
import { get, writable } from "svelte/store";
import { vi, test, expect } from "vitest";

import { currentTime } from "../src/global-store/current-time";
import { settings } from "../src/global-store/settings";
import { useTaskVisuals } from "../src/ui/hooks/use-task-visuals";

import { baseTask } from "./edit/util/test-utils";

vi.mock("obsidian", () => {
  return {};
});
vi.mock("obsidian-dataview", () => {
  return {};
});

function getBaseUseTaskProps() {
  const cursorOffsetY = writable(0);
  return {
    settings,
    currentTime,
    cursorOffsetY,
    onUpdate: vi.fn(),
    onpointerup: vi.fn(),
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
