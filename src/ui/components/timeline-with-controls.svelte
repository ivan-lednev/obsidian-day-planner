<script lang="ts">
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import type { Task } from "../../task-types";
  import { createColumnSelectionMenu } from "../column-selection-menu";

  import ActiveClocks from "./active-clocks.svelte";
  import BlockList from "./block-list.svelte";
  import ControlButton from "./control-button.svelte";
  import { Settings } from "./lucide";
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
  <Tree isInitiallyOpen title="Active clocks">
    {#snippet flair()}
      {String($tasksWithActiveClockProps.length)}
    {/snippet}
    <ActiveClocks --search-results-bg-color="var(--background-primary)" />
  </Tree>
{/if}

{#if $settings.showUncheduledTasks}
  <Tree isInitiallyOpen title="Unscheduled tasks">
    {#snippet flair()}
      {String(displayedAllDayTasks.length)}
    {/snippet}
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

{#if $settings.showTimelineInSidebar}
  <Tree isInitiallyOpen title="Timeline">
    {#snippet controls()}
      <ControlButton
        --border-radius="0"
        label="Timeline Settings"
        onclick={(event) => {
          createColumnSelectionMenu({ settings, event });
        }}
      >
        <Settings class="planner-settings-icon" />
      </ControlButton>
    {/snippet}
    <Scroller class={["planner-timeline-scroller", "planner-flex-scrollable"]}>
      {#snippet children(isUnderCursor)}
        <Ruler visibleHours={getVisibleHours($settings)} />
        <Timeline day={firstDayInRange} {isUnderCursor} />
      {/snippet}
    </Scroller>
  </Tree>
{/if}

<style>
  :global(svg.svg-icon.planner-settings-icon) {
    width: var(--icon-s);
    height: var(--icon-s);
  }

  :global(.planner-timeline-scroller) {
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
