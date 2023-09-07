import chroma from "chroma-js";
import { derived } from "svelte/store";

import type { PlanItem } from "../../types";
import { getTextColorWithEnoughContrast } from "../../util/color";

import type { ReactiveSettingsWithUtils } from "./new-use-drag";

interface UseColorProps {
  settings: ReactiveSettingsWithUtils;
  task: PlanItem;
}

export function useColor({ settings, task }: UseColorProps) {
  // todo: this is lame
  const colorScale = derived(settings.settings, ($settings) => {
    return chroma
      .scale([$settings.timelineStartColor, $settings.timelineEndColor])
      .mode("lab");
  });

  const backgroundColor = derived(
    [settings.settings, colorScale],
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
    [settings.settings, backgroundColor],
    ([$settings, $backgroundColor]) => {
      // todo: remove startTime once task creation returns consistent tasks
      return $settings.timelineColored && task.startTime
        ? getTextColorWithEnoughContrast($backgroundColor)
        : {
            normal: "var(--text-normal)",
            muted: "var(--text-muted)",
            faint: "var(--text-faint)",
          };
    },
  );

  return { properContrastColors, backgroundColor };
}
