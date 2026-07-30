<script lang="ts">
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settingsStore } from "../../global-store/settings";
  import type { TimelineTimeBlock } from "../../time-block-types";

  import BlockList from "./block-list.svelte";
  import ErrorBoundary from "./error-boundary.svelte";
  import Ruler from "./ruler.svelte";
  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const { editContext, pointerDateTime } = getObsidianContext();

  const getDisplayedAllDayTimeBlocksForMultiDayRow = fromStore(
    editContext.getDisplayedAllDayTimeBlocksForMultiDayRow,
  );

  const dateRange = getDateRangeContext();
  const firstDayInRange = $derived(dateRange.first);
  const lastDayInRange = $derived(dateRange.last);

  const displayedAllDayTimeBlocks = $derived(
    getDisplayedAllDayTimeBlocksForMultiDayRow.current({
      start: firstDayInRange,
      end: lastDayInRange,
    }),
  );

  let rulerRef: HTMLDivElement | undefined = $state();

  function handleAllDayEventsPointerMove() {
    pointerDateTime.set({
      dateTime: dateRange.first,
      type: "date",
    });
  }

  function handleScroll(event: Event) {
    if (!(event.target instanceof Element)) {
      return;
    }

    if (rulerRef) {
      rulerRef.scrollTop = event.target.scrollTop;
    }
  }
</script>

<ErrorBoundary>
  <div class="corner"></div>

  <div bind:this={rulerRef} class="ruler">
    <Ruler visibleHours={getVisibleHours($settingsStore)} />
    <div class="scrollbar-filler"></div>
  </div>

  <div class="controls-row">
    <TimelineControls />
  </div>

  <!--  TODO: possibly no need for block list, it only makes things worse through its animation-->
  <div
    class="all-day-row"
    onpointermove={handleAllDayEventsPointerMove}
    onpointerup={editContext.confirmEdit}
  >
    <BlockList
      --block-list-padding="var(--size-2-1) 3px 0"
      className="all-day-events"
      list={displayedAllDayTimeBlocks}
    >
      {#snippet match(timeBlock: TimelineTimeBlock)}
        <UnscheduledTimeBlock {timeBlock} />
      {/snippet}
      {#snippet fallback()}
        <div class="empty-all-day-events">No all day events</div>
      {/snippet}
    </BlockList>
  </div>

  <Scroller
    class={["planner-timeline-scroller", "timeline-row"]}
    onscroll={handleScroll}
  >
    {#snippet children(isUnderCursor)}
      <Timeline day={firstDayInRange} {isUnderCursor} />
    {/snippet}
  </Scroller>
</ErrorBoundary>

<style>
  .corner {
    grid-area: corner;
    background-color: var(--background-primary);
    border-block: var(--border-base);
    border-inline-end: var(--border-base);
  }

  .ruler {
    overflow-y: hidden;
    grid-area: ruler;
    box-shadow: var(--shadow-right);
  }

  .scrollbar-filler {
    height: var(--scrollbar-width);
    background-color: var(--background-primary);
  }

  .controls-row {
    grid-area: controls;
  }

  .all-day-row {
    overflow: auto;
    grid-area: all-day;

    max-height: 16vh;

    background-color: var(--background-primary);
    border-block-end: var(--border-base);
  }

  :global(.timeline-row) {
    grid-area: timeline;
  }

  :global(.planner-timeline-scroller) {
    overflow: auto;
  }

  :global(.unscheduled-time-block-container) {
    overflow: auto;
  }

  .empty-all-day-events {
    display: flex;
    align-items: center;
    justify-content: center;

    padding-block: var(--size-4-2);

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
