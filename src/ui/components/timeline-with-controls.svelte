<script lang="ts">
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import type { TimeBlock } from "../../time-block-types";
  import { createColumnSelectionMenu } from "../column-selection-menu";

  import BlockList from "./block-list.svelte";
  import ControlButton from "./control-button.svelte";
  import ErrorBoundary from "./error-boundary.svelte";
  import Tree from "./obsidian/tree.svelte";
  import Ruler from "./ruler.svelte";
  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const { editContext, pointerDateTime } = getObsidianContext();

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

  const { timeTracker, planner } = $derived($settings.timelineColumns);
</script>

<ErrorBoundary>
  <TimelineControls />

  {#if $settings.showUncheduledTasks}
    <Tree
      onpointermove={handleResizeableBoxPointerMove}
      onpointerup={editContext.confirmEdit}
      title="All day events"
    >
      {#snippet flair()}
        {#if editOperation.current}
          Drag here to schedule all-day events
        {:else}
          {String(displayedAllDayTasks.length)}
        {/if}
      {/snippet}
      {#if displayedAllDayTasks.length > 0}
        <BlockList list={displayedAllDayTasks}>
          {#snippet match(task: TimeBlock)}
            <UnscheduledTimeBlock
              --time-block-padding="var(--size-2-1) 0"
              {task}
            />
          {/snippet}
        </BlockList>
      {/if}
    </Tree>
  {/if}

  {#if $settings.showTimelineInSidebar}
    <Tree title="Timeline">
      {#snippet controls()}
        <ControlButton
          --border-radius="0"
          label="Timeline Settings"
          onclick={(event) => {
            createColumnSelectionMenu({ settings, event });
          }}
        >
          <span class="control-text">
            {#if planner && timeTracker}
              Planner | Tracker
            {:else if planner}
              Planner
            {:else if timeTracker}
              Tracker
            {/if}
          </span>
        </ControlButton>
      {/snippet}
      <Scroller
        class={["planner-timeline-scroller", "planner-flex-scrollable"]}
      >
        {#snippet children(isUnderCursor)}
          <Ruler visibleHours={getVisibleHours($settings)} />
          <Timeline day={firstDayInRange} {isUnderCursor} />
        {/snippet}
      </Scroller>
    </Tree>
  {/if}
</ErrorBoundary>

<style>
  :global(svg.svg-icon.planner-settings-icon) {
    width: var(--icon-s);
    height: var(--icon-s);
  }

  :global(.planner-timeline-scroller) {
    border-top: var(--border-base);
  }

  :global(.unscheduled-task-container) {
    overflow: auto;
  }

  .control-text {
    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }

  .control-text:hover {
    color: var(--text-muted);
  }
</style>
