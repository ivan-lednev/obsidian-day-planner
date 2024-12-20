import { on } from "svelte/events";

import { getDisplayedText } from "../../parser/parser";
import type { VaultFacade } from "../../service/vault-facade";
import type { DayPlannerSettings } from "../../settings";
import type { LocalTask } from "../../task-types";
import type { RenderMarkdown } from "../../types";
import { deleteProps } from "../../util/properties";
import { getFirstLine, getRenderKey } from "../../util/task-utils";
import { normalizeNewlines } from "../../util/util";

import { createMemo } from "./memoize-props";

interface RenderedMarkdownProps {
  task: LocalTask;
  settings: DayPlannerSettings;
  renderMarkdown: RenderMarkdown;
  toggleCheckboxInFile: VaultFacade["toggleCheckboxInFile"];
}

function stopPropagationOnCheckbox(event: Event) {
  if (event.target instanceof HTMLElement && event.target.dataset.line) {
    event.stopPropagation();
  }
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

    const displayedText = normalizeNewlines(
      deleteProps(getDisplayedText(task)),
    );
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

    onDestroy.push(
      on(el, "pointerup", handlePointerUp),
      on(el, "mouseup", stopPropagationOnCheckbox),
      on(el, "touchend", stopPropagationOnCheckbox),
    );
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
