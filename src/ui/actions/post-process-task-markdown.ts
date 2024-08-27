import { DayPlannerSettings } from "../../settings";
import { UnscheduledTask } from "../../types";
import { createTimestamp, formatDuration } from "../../util/task-utils";

export function decorate(
  el: HTMLElement,
  task: UnscheduledTask,
  settings: DayPlannerSettings,
) {
  const checkBox = el.querySelector('input[type="checkbox"]');

  if (
    checkBox &&
    settings.showDurationInTaskBlock &&
    // @ts-expect-error
    task.startMinutes &&
    task.durationMinutes >= 0
  ) {
    const durationFormated = formatDuration(task.durationMinutes);

    checkBox.after(
      createSpan({
        text: durationFormated,
        cls: "day-planner-task-decoration",
      }),
    );
  }

  // TODO: fix this forking
  // TODO: should work with list items
  // @ts-expect-error
  if (checkBox && settings.showTimestampInTaskBlock && task.startMinutes) {
    const timestamp = createTimestamp(
      // @ts-expect-error
      task.startMinutes,
      task.durationMinutes,
      settings.timestampFormat,
    );

    checkBox.after(
      createSpan({
        text: timestamp,
        cls: "day-planner-task-decoration",
      }),
    );
  }
}

export function disableCheckBoxes(el: HTMLElement) {
  el
    .querySelectorAll(`input[type="checkbox"]`)
    ?.forEach((checkbox) => checkbox.setAttribute("disabled", "true"));
}
