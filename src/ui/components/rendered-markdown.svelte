<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    isListItemSourced,
    type LocalTimeBlock,
  } from "../../time-block-types";
  import {
    isCompleted,
    toRenderableMarkdown,
  } from "../../util/time-block-utils";
  import { addLineDataToCheckboxes } from "../../util/dom";
  import { on } from "svelte/events";
  import type { Snippet } from "svelte";
  import type { ListItemEntryWithChildren } from "src/redux/index/index-slice";

  const { task, children }: { task: LocalTimeBlock; children: Snippet } =
    $props();

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
    if (!isListItemSourced(task)) {
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
    markdown: string,
    taskLines: Array<number | undefined>,
  ) {
    return (el: HTMLElement) => {
      const destroyMarkdown = renderMarkdown(el, markdown);

      addLineDataToCheckboxes(el, taskLines);

      const offPointerUp = on(el, "pointerup", handlePointerUp);
      const offMouseUp = on(el, "mouseup", stopPropagationForElWithLineData);
      // todo: fix checkboxes
      const offTouchEnd = on(el, "touchend", stopPropagationForElWithLineData);

      return () => {
        destroyMarkdown();
        offPointerUp();
        offMouseUp();
        offTouchEnd();
      };
    };
  }

  const { listItem, nestedListItems, paragraphs } = $derived(
    toRenderableMarkdown(task),
  );

  function flatten(
    entries: ListItemEntryWithChildren[],
  ): ListItemEntryWithChildren[] {
    return (
      entries.flatMap((child) => [child, ...flatten(child.children ?? [])]) ??
      []
    );
  }

  // todo: frontmatter entries should never end up in this component
  const listItemLine = $derived(
    isListItemSourced(task) ? task.location.position.start.line : undefined,
  );
  const nestedListItemLines = $derived(
    flatten(task.children ?? [])
      .filter((task) => task.task !== undefined)
      .map((item) => item.position.start.line),
  );
</script>

<div
  class={[
    "rendered-markdown",
    "planner-sticky-block-content",
    isCompleted(task.task) && "is-completed",
  ]}
>
  <div
    class="first-line-wrapper"
    {@attach createRenderMarkdownAttachment(listItem, [listItemLine])}
  ></div>

  {@render children?.()}

  {#if $settings.showSubtasksInTaskBlocks && nestedListItems}
    <div
      class="lines-after-first-wrapper"
      {@attach createRenderMarkdownAttachment(
        nestedListItems,
        nestedListItemLines,
      )}
    ></div>
  {/if}
</div>

<style>
  .rendered-markdown {
    --checkbox-size: var(--planner-time-block-font-size, var(--font-ui-small));
    --checklist-done-color: var(--text-faint);
    --checkbox-border-color: var(--text-faint);

    display: flex;
    flex: 1 0 0;
    flex-direction: column;
    gap: var(--rendered-markdown-gap);

    padding: var(--rendered-markdown-padding, var(--size-2-1) var(--size-4-1));

    color: var(--text-muted);
  }

  .rendered-markdown.is-completed {
    color: var(--checklist-done-color);
  }

  .rendered-markdown :global(p),
  .rendered-markdown :global(ul) {
    margin-block: 0;
  }

  .rendered-markdown :global(ul),
  .rendered-markdown :global(ol) {
    padding-inline-start: var(--size-4-5);
  }

  .rendered-markdown :global(input[type="checkbox"]) {
    top: 2px;
    margin-inline-end: 4px;
  }

  .first-line-wrapper {
    font-weight: var(
      --planner-time-block-summary-font-weight,
      var(--font-semibold)
    );
  }

  .lines-after-first-wrapper {
    padding-inline-start: var(
      --planner-time-block-nested-items-padding-inline-start,
      var(--size-4-4)
    );
  }
</style>
