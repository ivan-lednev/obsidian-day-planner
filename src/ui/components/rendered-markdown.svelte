<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import type { FileLine, LocalTask } from "../../task-types";
  import { removeTimestamp } from "../../util/task-utils";
  import { deleteProps } from "../../util/props";
  import { getFirstLine, getLinesAfterFirst } from "../../util/markdown";
  import dedent from "ts-dedent";
  import {
    addLineDataToCheckboxes,
    readCheckboxLineData,
  } from "../../util/dom";
  import { on } from "svelte/events";
  import type { Snippet } from "svelte";

  const { task, children }: { task: LocalTask; children: Snippet } = $props();

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

    event.stopPropagation();

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

<div class={["rendered-markdown", "planner-sticky-block-content"]}>
  <div
    class="first-line-wrapper"
    {@attach createRenderMarkdownAttachment(
      removeTimestamp(deleteProps(getFirstLine(task.text))),
      task.lines?.[0] || [],
    )}
  ></div>

  {@render children?.()}

  {#if $settings.showSubtasksInTaskBlocks}
    <div
      class="lines-after-first-wrapper"
      {@attach createRenderMarkdownAttachment(
        dedent(deleteProps(getLinesAfterFirst(task.text))).trimStart(),
        task.lines?.slice(1) || [],
      )}
    ></div>
  {/if}
</div>

<style>
  .rendered-markdown {
    --checkbox-size: var(--font-ui-small);

    flex: 1 0 0;
    padding: var(--size-2-1) var(--size-4-1);
    color: var(--text-muted);
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
    color: var(--text-muted);
  }

  .rendered-markdown :global(li.task-list-item[data-task="x"]),
  .rendered-markdown :global(li.task-list-item[data-task="X"]) {
    color: var(--text-faint);
  }

  .first-line-wrapper {
    font-weight: var(--font-semibold);
  }
</style>
