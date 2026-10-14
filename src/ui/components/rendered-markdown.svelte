<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ListItemEntryWithChildren } from "src/redux/index/index-slice";

  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    isListItemSourced,
    isUnwritten,
    type LocalTimeBlock,
  } from "../../time-block-types";
  import {
    isCompleted,
    toRenderableMarkdown,
  } from "../../util/time-block-utils";

  import TimeBlockContentLayout from "./time-block-content-layout.svelte";

  const {
    timeBlock,
    bottomDecoration,
  }: { timeBlock: LocalTimeBlock; bottomDecoration?: Snippet } = $props();

  const {
    createRenderMarkdownAttachment,
    toggleCheckboxInFile,
    settingsStore,
  } = getObsidianContext();

  const { listItem, nestedListItems } = $derived(
    toRenderableMarkdown(timeBlock),
  );

  function flatten(
    entries: ListItemEntryWithChildren[],
  ): ListItemEntryWithChildren[] {
    return (
      entries.flatMap((child) => [child, ...flatten(child.children ?? [])]) ??
      []
    );
  }

  const listItemLine = $derived(
    isListItemSourced(timeBlock) ? timeBlock.position.start.line : undefined,
  );

  const nestedListItemLines = $derived(
    flatten(timeBlock.children ?? [])
      .filter((child) => child.task !== undefined)
      .map((item) => item.position.start.line),
  );

  async function onCheckboxLineClick(line: number) {
    if (isUnwritten(timeBlock)) {
      throw new Error("Cannot complete tasks in in-memory time blocks");
    }

    await toggleCheckboxInFile(timeBlock.path, line);
  }
</script>

<TimeBlockContentLayout
  class="planner-sticky-block-content"
  completed={isCompleted(timeBlock.task)}
  {bottomDecoration}
>
  {#snippet title()}
    <div
      class="markdown-wrapper first-line-wrapper"
      {@attach createRenderMarkdownAttachment({
        getMarkdown: () => listItem,
        getTaskLines: () => [listItemLine],
        onCheckboxLineClick,
      })}
    ></div>
  {/snippet}

  {#snippet contents()}
    {#if $settingsStore.showSubtasksInTaskBlocks && nestedListItems}
      <div
        class="markdown-wrapper lines-after-first-wrapper"
        {@attach createRenderMarkdownAttachment({
          getMarkdown: () => nestedListItems,
          getTaskLines: () => nestedListItemLines,
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
