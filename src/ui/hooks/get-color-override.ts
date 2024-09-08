import type { DayPlannerSettings } from "../../settings";
import type { UnscheduledTask } from "../../types";
import { getFirstLine } from "../../util/task-utils";

export function getColorOverride(
  task: UnscheduledTask,
  isDarkMode: boolean,
  settings: DayPlannerSettings,
) {
  const colorOverride = settings.colorOverrides.find((override) =>
    getFirstLine(task.text).includes(override.text),
  );

  if (colorOverride) {
    return isDarkMode ? colorOverride?.darkModeColor : colorOverride?.color;
  }

  return "var(--time-block-bg-color, var(--background-primary))";
}
