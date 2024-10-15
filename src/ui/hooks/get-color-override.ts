import type { DayPlannerSettings } from "../../settings";
import type { Task } from "../../task-types";
import { getOneLineSummary } from "../../util/task-utils";

export function getColorOverride(
  task: Task,
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
