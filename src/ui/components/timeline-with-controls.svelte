<script lang="ts">
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import type { TimelineTimeBlock } from "../../time-block-types";

  import BlockList from "./block-list.svelte";
  import ErrorBoundary from "./error-boundary.svelte";
  import Ruler from "./ruler.svelte";
  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const { editContext, pointerDateTime } = getObsidianContext();

  const getDisplayedAllDayTasksForMultiDayRow = fromStore(
    editContext.getDisplayedAllDayTasksForMultiDayRow,
  );

  const dateRange = fromStore(getDateRangeContext());
  const firstDayInRange = $derived(dateRange.current[0]);

  const displayedAllDayTasks = $derived(
    getDisplayedAllDayTasksForMultiDayRow.current({
      start: firstDayInRange,
      end: dateRange.current[dateRange.current.length - 1],
    }),
  );

  function handleAllDayEventsPointerMove() {
    pointerDateTime.set({
      dateTime: dateRange.current[0],
      type: "date",
    });
  }
</script>

<ErrorBoundary>
  <TimelineControls />

  <!--  TODO: possibly no need for block list, it only makes things worse through its animation-->
  <BlockList
    --block-list-padding="var(--size-2-1) var(--size-2-1) 0"
    className="all-day-events"
    list={displayedAllDayTasks}
    onpointermove={handleAllDayEventsPointerMove}
    onpointerup={editContext.confirmEdit}
  >
    {#snippet match(task: TimelineTimeBlock)}
      <UnscheduledTimeBlock {task} />
    {/snippet}
    {#snippet fallback()}
      <div
        class="empty-all-day-events"
        onpointermove={handleAllDayEventsPointerMove}
        onpointerup={editContext.confirmEdit}
      >
        No all day events
      </div>
    {/snippet}
  </BlockList>

  <Scroller class={["planner-timeline-scroller"]}>
    {#snippet children(isUnderCursor)}
      <Ruler visibleHours={getVisibleHours($settings)} />
      <Timeline day={firstDayInRange} {isUnderCursor} />
    {/snippet}
  </Scroller>
</ErrorBoundary>

<style>
  :global(svg.svg-icon.planner-settings-icon) {
    width: var(--icon-s);
    height: var(--icon-s);
  }

  :global(.planner-timeline-scroller) {
    overflow: auto;
    border-top: var(--border-base);
  }

  :global(.unscheduled-task-container) {
    overflow: auto;
  }

  .empty-all-day-events {
    display: flex;
    align-items: center;
    justify-content: center;

    min-height: var(--size-4-6);

    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }

  /* todo: scoping */
  :global(.all-day-events),
  .empty-all-day-events {
    background-color: var(--background-primary);
    border-top: 1px solid var(--background-modifier-border);
  }
</style>
