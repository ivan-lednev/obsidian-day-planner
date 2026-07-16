<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ListItemEntryWithChildren } from "src/redux/index/index-slice";

  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    isListItemSourced,
    type LocalTimeBlock,
  } from "../../time-block-types";
  import { createRenderMarkdownAttachment } from "../../util/dom";
  import {
    isCompleted,
    toRenderableMarkdown,
  } from "../../util/time-block-utils";

  import TimeBlockContentLayout from "./time-block-content-layout.svelte";

  const {
    task,
    bottomDecoration,
  }: { task: LocalTimeBlock; bottomDecoration?: Snippet } = $props();

  const { renderMarkdown, toggleCheckboxInFile, settings } =
    getObsidianContext();

  const onCheckboxLineClick = $derived(
    isListItemSourced(task)
      ? (line: number) => toggleCheckboxInFile(task.path, line)
      : // todo: should throw an error
        undefined,
  );

  const { listItem, nestedListItems } = $derived(toRenderableMarkdown(task));

  function flatten(
    entries: ListItemEntryWithChildren[],
  ): ListItemEntryWithChildren[] {
    return (
      entries.flatMap((child) => [child, ...flatten(child.children ?? [])]) ??
      []
    );
  }

  const listItemLine = $derived(
    isListItemSourced(task) ? task.position.start.line : undefined,
  );
  const nestedListItemLines = $derived(
    flatten(task.children ?? [])
      .filter((task) => task.task !== undefined)
      .map((item) => item.position.start.line),
  );
</script>

<TimeBlockContentLayout
  class="planner-sticky-block-content"
  completed={isCompleted(task.task)}
  {bottomDecoration}
>
  {#snippet title()}
    <div
      class="markdown-wrapper first-line-wrapper"
      {@attach createRenderMarkdownAttachment({
        renderMarkdown,
        markdown: listItem,
        taskLines: [listItemLine],
        onCheckboxLineClick,
      })}
    ></div>
  {/snippet}

  {#snippet contents()}
    {#if $settings.showSubtasksInTaskBlocks && nestedListItems}
      <div
        class="markdown-wrapper lines-after-first-wrapper"
        {@attach createRenderMarkdownAttachment({
          renderMarkdown,
          markdown: nestedListItems,
          taskLines: nestedListItemLines,
          onCheckboxLineClick,
        })}
      ></div>
    {/if}
  {/snippet}
</TimeBlockContentLayout>

<style>
  .markdown-wrapper {
    --checkbox-size: var(--planner-time-block-font-size, var(--font-ui-small));
    --checklist-done-color: var(--text-faint);
    --checkbox-border-color: var(--text-faint);
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

  .markdown-wrapper :global(p),
  .markdown-wrapper :global(ul) {
    margin-block: 0;
  }

  .markdown-wrapper :global(ul),
  .markdown-wrapper :global(ol) {
    padding-inline-start: var(--size-4-5);
  }

  .markdown-wrapper :global(input[type="checkbox"]) {
    top: var(--size-2-1);
    margin-inline-end: var(--size-4-1);
  }
</style>
