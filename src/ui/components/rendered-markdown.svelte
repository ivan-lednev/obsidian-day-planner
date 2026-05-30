<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask } from "../../task-types";
  import { toRenderableMarkdown } from "../../util/task-utils";
  import { addLineDataToCheckboxes } from "../../util/dom";
  import { on } from "svelte/events";
  import type { Snippet } from "svelte";
  import type { ListItemEntryWithChildren } from "src/redux/index/index-slice";

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

  const listItemLine = $derived(task.location?.position.start.line);
  const nestedListItemLines = $derived(
    flatten(task.children ?? [])
      .filter((task) => task.task !== undefined)
      .map((item) => item.position.start.line),
  );
</script>

<div class={["rendered-markdown", "planner-sticky-block-content"]}>
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

    flex: 1 0 0;
    padding: var(--rendered-markdown-padding, var(--size-2-1) var(--size-4-1));
    color: var(--text-muted);
    display: flex;
    flex-direction: column;
  }

  :global(.is-mobile) .rendered-markdown {
    --checkbox-size: var(
      --planner-time-block-font-size,
      var(--font-ui-smaller)
    );
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
