import { derived, get, writable } from "svelte/store";

import type { DayPlannerSettings } from "../../settings";

export function createSettings(pluginSettings: DayPlannerSettings) {
  const settings = writable(pluginSettings);

  const hourSize = derived(settings, ($settings) => {
    return $settings.zoomLevel * 60;
  });

  const hiddenHoursSize = derived(
    [settings, hourSize],
    ([$settings, $hourSize]) => {
      return $settings.startHour * $hourSize;
    },
  );

  const visibleHours = derived(settings, ($settings) =>
    [...Array(24).keys()].slice($settings.startHour),
  );

  // todo: we should have size available in a task, so this should be a derived store
  // todo: dependent on resizing
  function sizeToDuration(size: number) {
    return size / get(settings).zoomLevel;
  }

  // todo: this was reactive previously
  function durationToSize(duration: number) {
    return duration * get(settings).zoomLevel;
  }

  function getTimeFromYOffset(offsetY: number) {
    return (offsetY + get(hiddenHoursSize)) / get(settings).zoomLevel;
  }

  // todo: not sure where this should live
  // const getYOffsetFromTime = derived(
  //   [settings, hiddenHoursSize],
  //   ([$settings, $hiddenHoursSize]) => {
  //     return (minutes: number) => {
  //       return minutes * $settings.zoomLevel - $hiddenHoursSize;
  //     };
  //   },
  // );

  return {
    settings,
    hourSize,
    hiddenHoursSize,
    visibleHours,
    sizeToDuration,
    durationToSize,
    getTimeFromYOffset,
  };
}
