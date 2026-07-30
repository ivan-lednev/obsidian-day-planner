import moment from "moment";
import { get, writable } from "svelte/store";
import { vi, test, expect } from "vitest";

import { currentTime } from "../src/global-store/current-time";
import { settingsStore } from "../src/global-store/settings";
import { useTimeBlockVisuals } from "../src/ui/hooks/use-time-block-visuals";

import { baseTimeBlock } from "./edit/util/fixtures";

vi.mock("obsidian", () => {
  return {};
});

function getBaseUseTimeBlockProps() {
  const cursorOffsetY = writable(0);
  return {
    settingsStore,
    currentTime,
    cursorOffsetY,
    onUpdate: vi.fn(),
    onpointerup: vi.fn(),
  };
}

test("derives task offset from settings and time", () => {
  const { offset, height } = useTimeBlockVisuals(
    { ...baseTimeBlock, startTime: moment("2023-01-01 13:00") },
    getBaseUseTimeBlockProps(),
  );

  expect(get(offset)).toEqual("840px");
  expect(get(height)).toEqual("120px");
});

test.skip("tasks change position and size when zoom level changes", () => {
  const { offset, height } = useTimeBlockVisuals(
    baseTimeBlock,
    getBaseUseTimeBlockProps(),
  );

  // TODO: this is leaking state to other tests, need to copy settings
  settingsStore.update((previous) => ({
    ...previous,
    zoomLevel: 1,
  }));

  expect(get(offset)).toEqual(`${4 * 60}px`);
  expect(get(height)).toEqual("60px");
});
