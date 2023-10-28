import { DayPlannerSettings } from "../../settings";
import { UnscheduledPlanItem } from "../../types";
import { createTimestamp } from "../../util/task-utils";

export function decorate(
  el: HTMLElement,
  task: UnscheduledPlanItem,
  settings: DayPlannerSettings,
) {
  const checkBox = el.querySelector('input[type="checkbox"]');

  // todo: fix this forking
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
