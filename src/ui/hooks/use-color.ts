import chroma from "chroma-js";
import { derived, type Readable } from "svelte/store";

import type { settings } from "../../global-store/settings";
import type { Task, WithTime } from "../../task-types";
import type { RelationToNow } from "../../types";
import { getTextColorWithEnoughContrast } from "../../util/color";

interface UseColorProps {
  settings: typeof settings;
  task: WithTime<Task>;
  relationToNow: Readable<RelationToNow>;
}

const defaultBorderColor = "var(--color-base-50)";

export function useColor({ settings, task, relationToNow }: UseColorProps) {
  // todo: move out. We only need one for all tasks
  const colorScale = derived(settings, ($settings) => {
    return chroma
      .scale([$settings.timelineStartColor, $settings.timelineEndColor])
      .mode("lab");
  });

  const backgroundColor = derived(
    [settings, colorScale, relationToNow],
    ([$settings, $colorScale, $relationToNow]) => {
      if ($settings.timelineColored) {
        const scaleKey =
          (task.startTime.hour() - $settings.startHour) /
          (24 - $settings.startHour);

        return $colorScale(scaleKey).hex();
      }

      if ($relationToNow === "past") {
        return "var(--background-secondary)";
      }

      return "var(--background-primary)";
    },
  );

  const borderColor = derived(relationToNow, ($relationToNow) => {
    return $relationToNow === "present"
      ? "var(--color-accent)"
      : defaultBorderColor;
  });

  const properContrastColors = derived(
    [settings, backgroundColor],
    ([$settings, $backgroundColor]) => {
      if ($settings.timelineColored) {
        return getTextColorWithEnoughContrast($backgroundColor);
      }

      return { normal: "inherit", muted: "inherit", faint: "inherit" };
    },
  );

  return { properContrastColors, backgroundColor, borderColor };
}
