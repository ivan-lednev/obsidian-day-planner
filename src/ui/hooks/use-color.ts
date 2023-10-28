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
  const colorScale = derived(settings, ($settings) => {
    return chroma
      .scale([$settings.timelineStartColor, $settings.timelineEndColor])
      .mode("lab");
  });

  const backgroundColor = derived(
    [settings, colorScale],
    ([$settings, $colorScale]) => {
      const scaleKey =
        (task.startTime.hour() - $settings.startHour) /
        (24 - $settings.startHour);

      // todo: remove startTime once task creation returns consistent tasks
      return $settings.timelineColored && task.startTime
        ? $colorScale(scaleKey).hex()
        : "var(--background-primary)";
    },
  );

  const properContrastColors = derived(
    [settings, backgroundColor],
    ([$settings, $backgroundColor]) => {
      // todo: remove startTime once task creation returns consistent tasks
      return $settings.timelineColored && task.startTime
        ? getTextColorWithEnoughContrast($backgroundColor)
        : {
            normal: "inherit",
            muted: "inherit",
            faint: "inherit",
          };
    },
  );

  return { properContrastColors, backgroundColor };
}
