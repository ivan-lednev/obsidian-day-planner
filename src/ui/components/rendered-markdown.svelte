<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import type { FileLine, LocalTask } from "../../task-types";
  import { createTimestamp, removeTimestamp } from "../../util/task-utils";
  import { getFirstLine, getLinesAfterFirst } from "../../util/markdown";
  import { getMinutesSinceMidnight } from "../../util/moment";
  import dedent from "ts-dedent";
  import { emDash } from "../../constants";
  import {
    addLineDataToCheckboxes,
    readCheckboxLineData,
  } from "../../util/dom";
  import { on } from "svelte/events";

  export let task: LocalTask;

  const { renderMarkdown, toggleCheckboxInFile, settings } =
    getObsidianContext();

  function stopPropagationForElWithLineData(event: Event) {
    if (event.target instanceof HTMLElement && event.target.dataset.line) {
      event.stopPropagation();
    }
  }

  function getLineNumberFromEvent(event: PointerEvent) {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    return Number(event.target.dataset.line);
  }

  async function handlePointerUp(event: PointerEvent) {
    if (!task.location) {
      return;
    }

    const line = getLineNumberFromEvent(event);

    if (!line) {
      return;
    }

    await toggleCheckboxInFile(task.location.path, line);
  }

  function createRenderMarkdownAttachment(
    text: string,
    lines: FileLine[] | FileLine,
  ) {
    return (el: HTMLElement) => {
      const destroyMarkdown = renderMarkdown(el, text);

      addLineDataToCheckboxes(el, lines);

      const offPointerUp = on(el, "pointerup", handlePointerUp);
      const offMouseUp = on(el, "mouseup", stopPropagationForElWithLineData);
      const offTouchEnd = on(el, "touchend", stopPropagationForElWithLineData);

      return () => {
        destroyMarkdown();
        offPointerUp();
        offMouseUp();
        offTouchEnd();
      };
    };
  }
</script>

<div class="rendered-markdown planner-sticky-block-content">
  <div
    class="first-line-wrapper"
    {@attach createRenderMarkdownAttachment(
      removeTimestamp(getFirstLine(task.text)),
      task.lines?.[0] || [],
    )}
  ></div>

  {#if $settings.showTimestampInTaskBlock}
    {createTimestamp(
      getMinutesSinceMidnight(task.startTime),
      task.durationMinutes,
      $settings.timestampFormat,
      emDash,
    )}
  {/if}

  {#if $settings.showSubtasksInTaskBlocks}
    <div
      class="lines-after-first-wrapper"
      {@attach createRenderMarkdownAttachment(
        dedent(getLinesAfterFirst(task.text)).trimStart(),
        task.lines?.slice(1) || [],
      )}
    ></div>
  {/if}
</div>

<style>
  :global(.planner-task-decoration) {
    margin: 0 0.25em;
    padding: 0.1em 0.25em;

    font-size: var(--tag-size);
    font-weight: var(--tag-weight);
    line-height: 1;
    color: var(--tag-color);
    text-decoration: var(--tag-decoration);

    background-color: var(--tag-background);
    border-radius: var(--radius-s);
  }

  .rendered-markdown {
    --checkbox-size: var(--font-ui-small);

    flex: 1 0 0;
    padding: var(--size-2-1) var(--size-4-1);
    color: var(--text-normal);
  }

  .rendered-markdown :global(p),
  .rendered-markdown :global(ul) {
    margin-block: 0;
  }

  .rendered-markdown :global(ul),
  .rendered-markdown :global(ol) {
    padding-inline-start: 20px;
  }

  .rendered-markdown :global(input[type="checkbox"]) {
    top: 2px;
    margin-inline-end: 4px;
    border-color: var(--text-muted);
  }

  .rendered-markdown :global(li) {
    color: var(--text-normal);
  }

  .rendered-markdown :global(li.task-list-item[data-task="x"]),
  .rendered-markdown :global(li.task-list-item[data-task="X"]) {
    color: var(--text-muted);
  }

  .first-line-wrapper {
    font-weight: var(--font-semibold);
  }
</style>
