import { derived } from "svelte/store";

import { settings } from "../../global-store/settings";
import type { UnscheduledTask } from "../../types";

export function useColorOverride(task: UnscheduledTask) {
  return derived(settings, ($settings) => {
    const colorOverride = $settings.colorOverrides.find((override) =>
      task.firstLineText.includes(override.text),
    );

    return colorOverride?.color;
  });
}
