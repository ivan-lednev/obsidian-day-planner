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

function decorate(
  el: HTMLElement,
  task: UnscheduledPlanItem,
  settings: DayPlannerSettings,
) {
  const firstListItem = el.querySelector("li");
  const checkBox = firstListItem.querySelector('input[type="checkbox"]');

  if (settings.showPathInTaskBlock) {
    const formattedPath = task.location.path.replace(/\.md$/, "");

    checkBox.after(
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

    checkBox.after(
      createSpan({
        text: timestamp,
        cls: "day-planner-task-decoration",
      }),
    );
  }
}

function disableCheckBoxes(el: HTMLElement) {
  el
    .querySelectorAll(`input[type="checkbox"]`)
    ?.forEach((checkbox) => checkbox.setAttribute("disabled", "true"));
}

export function renderTaskMarkdown(
  el: HTMLElement,
  initial: RenderedMarkdownProps,
) {
  let onDestroy: () => void;

  const shouldUpdate = createMemo(initial, {
    task: getRenderKey,
  });

  function refresh({ task, settings, renderMarkdown }: RenderedMarkdownProps) {
    onDestroy?.();
    onDestroy = renderMarkdown(el, task.text);
    disableCheckBoxes(el);
    decorate(el, task, settings);
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
