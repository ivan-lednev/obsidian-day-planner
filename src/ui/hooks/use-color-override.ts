import { derived, type Readable } from "svelte/store";

import { settings } from "../../global-store/settings";
import type { UnscheduledTask } from "../../types";
import { getFirstLine } from "../../util/task-utils";

export function useColorOverride(
  task: UnscheduledTask,
  isDarkMode: Readable<boolean>,
) {
  return derived([settings, isDarkMode], ([$settings, $isDarkMode]) => {
    const colorOverride = $settings.colorOverrides.find((override) =>
      getFirstLine(task.text).includes(override.text),
    );

    if (colorOverride) {
      return $isDarkMode ? colorOverride?.darkModeColor : colorOverride?.color;
    }
  });
}
