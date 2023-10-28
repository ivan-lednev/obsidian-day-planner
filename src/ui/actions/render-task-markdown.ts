import { identity } from "lodash/fp";
import { DayPlannerSettings } from "../../settings";
import type {
  PlanItem,
  RenderMarkdown,
  UnscheduledPlanItem,
} from "../../types";
import { getEndTime, getRenderKey } from "../../util/task-utils";

interface RenderedMarkdownProps {
  task: UnscheduledPlanItem;
  settings: DayPlannerSettings;
  renderMarkdown: RenderMarkdown;
}

type IdentityGetters<T> = Partial<{
  [Prop in keyof T]: (value: T[Prop]) => string;
}>;

// Can't figure out how to make TypeScript happy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createMemo<T extends Record<string, any>>(
  initialProps: T,
  identityGetters: IdentityGetters<T>,
) {
  let previousProps = initialProps;

  function shouldUpdate(newProps: T) {
    for (const [propKey, propValue] of Object.entries(newProps)) {
      const previousValue = previousProps[propKey];
      const identityFn = identityGetters?.[propKey] || identity;
      const propChanged = identityFn(propValue) !== identityFn(previousValue);

      if (propChanged) {
        previousProps = newProps;

        return true;
      }
    }

    return false;
  }

  return shouldUpdate;
}

export function renderTaskMarkdown(
  el: HTMLElement,
  initial: RenderedMarkdownProps,
) {
  let onDestroy: () => void;

  const shouldUpdate = createMemo(initial, {
    task: getRenderKey,
  });

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

  refresh(initial);

  return {
    update(props: RenderedMarkdownProps) {
      if (shouldUpdate(props)) {
        refresh(props);
      }
    },
    destroy() {
      onDestroy?.();
    },
  };
}
