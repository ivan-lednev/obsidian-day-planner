import chroma from "chroma-js";
import { derived } from "svelte/store";

import type { settings } from "../../global-store/settings";
import type { Task } from "../../types";
import { getTextColorWithEnoughContrast } from "../../util/color";

interface UseColorProps {
  settings: typeof settings;
  task: Task;
}

export function useColor({ settings, task }: UseColorProps) {
  // todo: move out. We only need one for all tasks
  const colorScale = derived(settings, ($settings) => {
    return chroma
      .scale([$settings.timelineStartColor, $settings.timelineEndColor])
      .mode("lab");
  });

  const backgroundColor = derived(
    [settings, colorScale],
    ([$settings, $colorScale]) => {
      // TODO: remove startTime once task creation returns consistent tasks
      if ($settings.timelineColored && task.startTime) {
        const scaleKey =
          (task.startTime.hour() - $settings.startHour) /
          (24 - $settings.startHour);

        return $colorScale(scaleKey).hex();
      }

      return "var(--background-primary)";
    },
  );

  const properContrastColors = derived(
    [settings, backgroundColor],
    ([$settings, $backgroundColor]) => {
      // TODO: remove startTime once task creation returns consistent tasks
      if ($settings.timelineColored && task.startTime) {
        return getTextColorWithEnoughContrast($backgroundColor);
      }

      return { normal: "inherit", muted: "inherit", faint: "inherit" };
    },
  );

  return { properContrastColors, backgroundColor };
}
