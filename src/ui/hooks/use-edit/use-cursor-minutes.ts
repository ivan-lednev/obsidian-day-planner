import { derived, Readable } from "svelte/store";

import { DayPlannerSettings } from "../../../settings";
import { offsetYToMinutes } from "../../../util/task-utils";

export function useCursorMinutes(
  pointerOffsetY: Readable<number>,
  settings: Readable<DayPlannerSettings>,
) {
  return derived([pointerOffsetY, settings], ([$pointerOffsetY, $settings]) =>
    offsetYToMinutes($pointerOffsetY, $settings.zoomLevel, $settings.startHour),
  );
}
