import { DayPlannerSettings } from "../../settings";
import type {
  PlanItem,
  RenderMarkdown,
  UnscheduledPlanItem,
} from "../../types";
import { getEndTime } from "../../util/task-utils";

interface RenderedMarkdownProps {
  task: UnscheduledPlanItem;
  settings: DayPlannerSettings;
  renderMarkdown: RenderMarkdown;
}

export function renderTaskMarkdown(
  el: HTMLElement,
  props: RenderedMarkdownProps,
) {
  let onDestroy: () => void;

  function decorate(task: UnscheduledPlanItem, settings: DayPlannerSettings) {
    const firstListItem = el.querySelector("li");

    // todo: Figure out what TypeScript needs here
    // @ts-ignore
    const listItemText: ChildNode = [...firstListItem.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE,
    );

    if (settings.showPathInTaskBlock) {
      const formattedPath = task.location.path.replace(/\.md$/, "");

      listItemText.after(
        createSpan({
          text: formattedPath,
          cls: "day-planner-task-decoration",
        }),
      );
    }

    if (settings.showTimestampInTaskBlock) {
      // @ts-ignore
      if (!task.startTime) {
        return;
      }

      const startTime = (task as PlanItem).startTime.format(
        settings.timestampFormat,
      );
      const endTime = getEndTime(task as PlanItem).format(
        settings.timestampFormat,
      );
      const timestamp = `${startTime} - ${endTime}`;

      listItemText.before(
        createSpan({
          text: timestamp,
          cls: "day-planner-task-decoration",
        }),
      );
    }
  }

  function disableCheckBoxes() {
    el
      .querySelectorAll(`input[type="checkbox"]`)
      ?.forEach((checkbox) => checkbox.setAttribute("disabled", "true"));
  }

  function refresh({ task, settings, renderMarkdown }: RenderedMarkdownProps) {
    onDestroy?.();
    onDestroy = renderMarkdown(el, task.text);
    disableCheckBoxes();
    decorate(task, settings);
  }

  refresh(props);

  return {
    update(props: RenderedMarkdownProps) {
      refresh(props);
    },
    destroy() {
      onDestroy?.();
    },
  };
}
