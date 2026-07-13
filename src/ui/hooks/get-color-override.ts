import type { DayPlannerSettings } from "../../settings";
import type { TimeBlock } from "../../time-block-types";
import { getOneLineSummary } from "../../util/time-block-utils";

export function getColorOverride(
  task: TimeBlock,
  isDarkMode: boolean,
  settings: DayPlannerSettings,
) {
  const colorOverride = settings.colorOverrides.find((override) =>
    getOneLineSummary(task).includes(override.text),
  );

  if (colorOverride) {
    return isDarkMode ? colorOverride?.darkModeColor : colorOverride?.color;
  }

  return "var(--time-block-bg-color, var(--background-primary))";
}
