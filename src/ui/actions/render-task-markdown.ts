import { getDisplayedText } from "../../parser/parser";
import { DayPlannerSettings } from "../../settings";
import type { RenderMarkdown, UnscheduledTask } from "../../types";
import { getFirstLine, getRenderKey } from "../../util/task-utils";

import { createMemo } from "./memoize-props";
import { disableCheckBoxes } from "./post-process-task-markdown";

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

    const displayedText = getDisplayedText(task);
    const onlyFirstLineIfNeeded = settings.showSubtasksInTaskBlocks
      ? displayedText
      : getFirstLine(displayedText);

    onDestroy = renderMarkdown(el, onlyFirstLineIfNeeded);

    disableCheckBoxes(el);
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
