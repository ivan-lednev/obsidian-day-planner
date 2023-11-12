import { derived, Readable } from "svelte/store";

import { DayPlannerSettings } from "../../../settings";
import { offsetYToMinutes } from "../../../util/task-utils";

export function useCursorMinutes(
  pointerOffsetY: Readable<number>,
  settings: DayPlannerSettings,
) {
  return derived(pointerOffsetY, ($pointerOffsetY) =>
    offsetYToMinutes($pointerOffsetY, settings.zoomLevel, settings.startHour),
  );
}
