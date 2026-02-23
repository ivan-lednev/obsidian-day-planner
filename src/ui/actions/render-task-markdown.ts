import { dedent } from "ts-dedent";

import type { VaultFacade } from "../../service/vault-facade";
import type { DayPlannerSettings } from "../../settings";
import type { LocalTask } from "../../task-types";
import type { RenderMarkdown } from "../../types";
import { getFirstLine, getLinesAfterFirst } from "../../util/markdown";
import { getMinutesSinceMidnight } from "../../util/moment";
import {
  createTimestamp,
  getRenderKey,
  removeTimestamp,
} from "../../util/task-utils";

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

  function destroy() {
    el.empty();
    onDestroy.forEach((callback) => callback());
    onDestroy = [];
  }

  const shouldUpdate = createMemo(initial, {
    task: getRenderKey,
  });

  function refresh({ task, settings, renderMarkdown }: RenderedMarkdownProps) {
    destroy();

    const firstLine = removeTimestamp(getFirstLine(task.text));
    const firstLineContainer = el.createDiv({ cls: "first-line-wrapper" });
    onDestroy.push(renderMarkdown(firstLineContainer, firstLine));

    el.createDiv({ cls: "props-wrapper" }, (el) => {
      el.setText(
        createTimestamp(
          getMinutesSinceMidnight(task.startTime),
          task.durationMinutes,
          settings.timestampFormat,
          "–",
        ),
      );
    });

    const linesAfterFirst = dedent(getLinesAfterFirst(task.text)).trimStart();
    const linesAfterFirstContainer = el.createDiv({
      cls: "lines-after-first-wrapper",
    });
    onDestroy.push(renderMarkdown(linesAfterFirstContainer, linesAfterFirst));

    // const displayedText = normalizeNewlines(
    //   deleteProps(getTextForRendering(task)),
    // );
    // const onlyFirstLineIfNeeded = settings.showSubtasksInTaskBlocks
    //   ? displayedText
    //   : getFirstLine(displayedText);
    //
    // onDestroy.push(renderMarkdown(el, onlyFirstLineIfNeeded));
    //
    // if (!task.lines) {
    //   return;
    // }
    //
    // const linesWithTasks = task.lines.filter((line) => line.task);
    //
    // el.querySelectorAll('[data-task] input[type="checkbox"]').forEach(
    //   (checkbox, i) => {
    //     if (!(checkbox instanceof HTMLElement) || !task.location) {
    //       return;
    //     }
    //
    //     checkbox.dataset.line = String(linesWithTasks[i].line);
    //   },
    // );
    //
    // async function handlePointerUp(event: PointerEvent) {
    //   if (!(event.target instanceof HTMLElement) || !task.location) {
    //     return;
    //   }
    //
    //   const line = event.target.dataset.line;
    //
    //   if (!line) {
    //     return;
    //   }
    //
    //   event.stopPropagation();
    //   await initial.toggleCheckboxInFile(task.location.path, Number(line));
    // }
    //
    // onDestroy.push(
    //   on(el, "pointerup", handlePointerUp),
    //   on(el, "mouseup", stopPropagationOnCheckbox),
    //   on(el, "touchend", stopPropagationOnCheckbox),
    // );
  }

  refresh(initial);

  return {
    destroy() {
      destroy();
    },
  };
}
