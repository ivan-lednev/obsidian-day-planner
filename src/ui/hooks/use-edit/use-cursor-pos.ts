import { Moment } from "moment/moment";
import { derived, writable } from "svelte/store";

import { DayPlannerSettings } from "../../../settings";

import { useCursorMinutes } from "./use-cursor-minutes";

export function useCursorPos({ settings }: { settings: DayPlannerSettings }) {
  const pointerOffsetY = writable(0);
  const cursorDay = writable<Moment>();
  const cursorMinutes = useCursorMinutes(pointerOffsetY, settings);

  const cursorPos = derived(
    [cursorDay, cursorMinutes],
    ([$cursorDay, $cursorMinutes]) => {
      return {
        minutes: $cursorMinutes,
        day: $cursorDay,
      };
    },
  );

  return {
    cursorPos,
    cursorDay,
    pointerOffsetY,
  };
}
