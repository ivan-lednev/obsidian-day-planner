<script lang="ts">
  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import type { Task } from "../../task-types";

  import ActiveClocks from "./active-clocks.svelte";
  import BlockList from "./block-list.svelte";
  import Tree from "./obsidian/tree.svelte";
  import ResizeHandle from "./resize-handle.svelte";
  import ResizeableBox from "./resizeable-box.svelte";
  import Ruler from "./ruler.svelte";
  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const dateRange = getDateRangeContext();
  const firstDayInRange = $derived($dateRange[0]);

  const {
    editContext: { getDisplayedTasksForTimeline },
    tasksWithActiveClockProps,
  } = getObsidianContext();

  const displayedTasksForTimeline = $derived(
    getDisplayedTasksForTimeline(firstDayInRange),
  );
</script>

<div class="controls">
  <TimelineControls />

  {#if $settings.showActiveClocks}
    <Tree
      flair={String($tasksWithActiveClockProps.length)}
      isInitiallyOpen
      title="Active clocks"
    >
      <ActiveClocks --search-results-bg-color="var(--background-primary)" />
    </Tree>
  {/if}

  {#if $settings.showUncheduledTasks}
    <Tree
      flair={String($displayedTasksForTimeline.noTime.length)}
      isInitiallyOpen
      title="Unscheduled tasks"
    >
      {#if $displayedTasksForTimeline.noTime.length > 0}
        <ResizeableBox class="unscheduled-task-container">
          {#snippet children(startEdit)}
            <BlockList
              --search-results-bg-color="var(--background-primary)"
              list={$displayedTasksForTimeline.noTime}
            >
              {#snippet match(task: Task)}
                <UnscheduledTimeBlock
                  --time-block-padding="var(--size-4-1)"
                  {task}
                />
              {/snippet}
            </BlockList>
            <ResizeHandle on:mousedown={startEdit} />
          {/snippet}
        </ResizeableBox>
      {/if}
    </Tree>
  {/if}
</div>

<Scroller>
  {#snippet children(isUnderCursor)}
    <Ruler visibleHours={getVisibleHours($settings)} />
    <Timeline day={firstDayInRange} {isUnderCursor} />
  {/snippet}
</Scroller>

<style>
  .controls {
    position: relative;
    z-index: 1000;
    box-shadow: var(--shadow-bottom);
  }

  .controls > :global(*) {
    border-bottom: 1px solid var(--background-modifier-border);
  }

  :global(.unscheduled-task-container) {
    overflow: auto;
  }
</style>
