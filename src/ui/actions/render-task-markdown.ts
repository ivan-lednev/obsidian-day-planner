import type { App } from "obsidian";
import { on } from "svelte/events";

import { getDisplayedText } from "../../parser/parser";
import type { VaultFacade } from "../../service/vault-facade";
import type { DayPlannerSettings } from "../../settings";
import type { LocalTask } from "../../task-types";
import type { RenderMarkdown } from "../../types";
import { getFirstLine, normalizeNewlines } from "../../util/markdown";
import { deleteProps } from "../../util/props";
import { getRenderKey } from "../../util/task-utils";

import { createMemo } from "./memoize-props";

interface RenderedMarkdownProps {
  task: LocalTask;
  settings: DayPlannerSettings;
  renderMarkdown: RenderMarkdown;
  toggleCheckboxInFile: VaultFacade["toggleCheckboxInFile"];
  app: App;
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

    const sourcePath = task.location?.path || "/";
    onDestroy.push(renderMarkdown(el, onlyFirstLineIfNeeded, sourcePath));

    // Handle clicks on internal links
    async function handleLinkClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const link = target.classList.contains("internal-link")
        ? target
        : target.closest("a.internal-link");

      if (link instanceof HTMLAnchorElement && task.location) {
        event.preventDefault();
        event.stopPropagation();

        const linkText =
          link.getAttribute("data-href") || link.textContent || "";
        // Use Obsidian's workspace API to open the link
        await initial.app.workspace.openLinkText(linkText, sourcePath, false);
      }
    }

    onDestroy.push(on(el, "click", handleLinkClick));

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

      // Don't interfere with link clicks - let them bubble up to Obsidian's handlers
      if (
        event.target.classList.contains("internal-link") ||
        event.target.closest("a.internal-link")
      ) {
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
