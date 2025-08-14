<script lang="ts">
  import { fromStore } from "svelte/store";

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

  const { editContext, tasksWithActiveClockProps, pointerDateTime } =
    getObsidianContext();
  const getDisplayedAllDayTasksForMultiDayRow = fromStore(
    editContext.getDisplayedAllDayTasksForMultiDayRow,
  );
  const editOperation = fromStore(editContext.editOperation);

  const dateRange = fromStore(getDateRangeContext());
  const firstDayInRange = $derived(dateRange.current[0]);

  const displayedAllDayTasks = $derived(
    getDisplayedAllDayTasksForMultiDayRow.current({
      start: firstDayInRange,
      end: dateRange.current[dateRange.current.length - 1],
    }),
  );

  function handleResizeableBoxPointerMove() {
    pointerDateTime.set({
      dateTime: dateRange.current[0],
      type: "date",
    });
  }
</script>

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
    flair={String(displayedAllDayTasks.length)}
    isInitiallyOpen
    title="Unscheduled tasks"
  >
    {#if editOperation.current || displayedAllDayTasks.length > 0}
      <ResizeableBox
        class="unscheduled-task-container"
        onpointermove={handleResizeableBoxPointerMove}
        onpointerup={editContext.confirmEdit}
      >
        {#snippet children(startEdit)}
          {#if editOperation.current && displayedAllDayTasks.length === 0}
            <div class="edit-prompt">
              Drag blocks here to schedule all-day tasks
            </div>
          {:else if displayedAllDayTasks.length > 0}
            <BlockList
              --search-results-bg-color="var(--background-primary)"
              list={displayedAllDayTasks}
            >
              {#snippet match(task: Task)}
                <UnscheduledTimeBlock
                  --time-block-padding="var(--size-4-1)"
                  {task}
                />
              {/snippet}
            </BlockList>
          {/if}
          <ResizeHandle on:mousedown={startEdit} />
        {/snippet}
      </ResizeableBox>
    {/if}
  </Tree>
{/if}

<Tree --flex="1 1 auto" isInitiallyOpen title="Timeline">
  <Scroller class="timeline-scroller">
    {#snippet children(isUnderCursor)}
      <Ruler visibleHours={getVisibleHours($settings)} />
      <Timeline day={firstDayInRange} {isUnderCursor} />
    {/snippet}
  </Scroller>
</Tree>

<style>
  :global(.timeline-scroller) {
    border-top: 1px solid var(--background-modifier-border);
  }

  :global(.unscheduled-task-container) {
    overflow: auto;
  }

  .edit-prompt {
    display: flex;
    flex-direction: column;
    align-items: center;

    padding: var(--size-4-2);

    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }
</style>
