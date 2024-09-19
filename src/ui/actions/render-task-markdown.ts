import { getDisplayedText } from "../../parser/parser";
import type { ObsidianFacade } from "../../service/obsidian-facade";
import type { DayPlannerSettings } from "../../settings";
import type { LocalTask } from "../../task-types";
import type { RenderMarkdown } from "../../types";
import { getFirstLine, getRenderKey } from "../../util/task-utils";

import { createMemo } from "./memoize-props";

interface RenderedMarkdownProps {
  task: LocalTask;
  settings: DayPlannerSettings;
  renderMarkdown: RenderMarkdown;
  toggleCheckboxInFile: ObsidianFacade["toggleCheckboxInFile"];
}

export function renderTaskMarkdown(
  el: HTMLElement,
  initial: RenderedMarkdownProps,
) {
  let onDestroy: Array<() => void> = [];

  function cleanUp() {
    onDestroy.forEach((callback) => callback());
    onDestroy = [];
  }

  const shouldUpdate = createMemo(initial, {
    task: getRenderKey,
  });

  function refresh({ task, settings, renderMarkdown }: RenderedMarkdownProps) {
    cleanUp();

    const displayedText = getDisplayedText(task);
    const onlyFirstLineIfNeeded = settings.showSubtasksInTaskBlocks
      ? displayedText
      : getFirstLine(displayedText);

    onDestroy.push(renderMarkdown(el, onlyFirstLineIfNeeded));

    if (!task.lines) {
      return;
    }

    const linesWithTasks = task.lines.filter((line) => line.task);

    el.querySelectorAll('[data-task] input[type="checkbox"]').forEach(
      (checkbox, i) => {
        if (!(checkbox instanceof HTMLElement) || !task.location) {
          return;
        }

        checkbox.dataset.line = String(linesWithTasks[i].line);
      },
    );

    async function handlePointerUp(event: PointerEvent) {
      if (!(event.target instanceof HTMLElement) || !task.location) {
        return;
      }

      const line = event.target.dataset.line;

      if (!line) {
        return;
      }

      event.stopPropagation();
      await initial.toggleCheckboxInFile(task.location.path, Number(line));
    }

    el.addEventListener("pointerup", handlePointerUp);
    onDestroy.push(() => el.removeEventListener("pointerup", handlePointerUp));
  }

  refresh(initial);

  return {
    update(props: RenderedMarkdownProps) {
      if (shouldUpdate(props)) {
        refresh(props);
      }
    },
    destroy() {
      cleanUp();
    },
  };
}
