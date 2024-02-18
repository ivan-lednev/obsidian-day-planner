import { DayPlannerSettings } from "../../settings";
import type { RenderMarkdown, UnscheduledTask } from "../../types";
import { getRenderKey } from "../../util/task-utils";

import { createMemo } from "./memoize-props";
import { decorate, disableCheckBoxes } from "./post-process-task-markdown";

interface RenderedMarkdownProps {
  task: UnscheduledTask;
  settings: DayPlannerSettings;
  renderMarkdown: RenderMarkdown;
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

    let text = task.text;

    if (settings.hideSubtasksInTaskBlocks) {
      text = task.text.split("\n")[0];
    }

    onDestroy = renderMarkdown(el, text);

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
