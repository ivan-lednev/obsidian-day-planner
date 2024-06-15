import { getContext } from "svelte";
import { derived } from "svelte/store";

import { obsidianContext } from "../../constants";
import { settings } from "../../global-store/settings";
import { ObsidianContext, UnscheduledTask } from "../../types";

export function useColorOverride(task: UnscheduledTask) {
  const { isDarkMode } = getContext<ObsidianContext>(obsidianContext);

  return derived([settings, isDarkMode], ([$settings, $isDarkMode]) => {
    const colorOverride = $settings.colorOverrides.find((override) =>
      task.firstLineText.includes(override.text),
    );

    if (colorOverride) {
      return $isDarkMode ? colorOverride?.darkModeColor : colorOverride?.color;
    }
  });
}

export function useTextColorOverride(task: UnscheduledTask) {
  const { isDarkMode } = getContext<ObsidianContext>(obsidianContext);

  return derived([settings, isDarkMode], ([$settings, $isDarkMode]) => {
    const colorOverride = $settings.colorOverrides.find((override) =>
      task.firstLineText.includes(override.text),
    );

    if (colorOverride) {
      return $isDarkMode
        ? colorOverride?.darkModeTextColor
        : colorOverride?.lightModeTextColor;
    }
  });
}
