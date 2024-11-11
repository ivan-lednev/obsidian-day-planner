<script lang="ts">
  import { getDateRangeContext } from "../../context/date-range-context";
  import { getVisibleHours } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";

  import ResizeHandle from "./resize-handle.svelte";
  import ResizeableBox from "./resizeable-box.svelte";
  import Ruler from "./ruler.svelte";
  import Scroller from "./scroller.svelte";
  import TimelineControls from "./timeline-controls.svelte";
  import Timeline from "./timeline.svelte";
  import UnscheduledTaskContainer from "./unscheduled-task-container.svelte";

  const dateRange = getDateRangeContext();
  const firstDayInRange = $derived($dateRange[0]);
</script>

<div class="controls">
  <TimelineControls />
  <ResizeableBox className="timeline-box">
    {#snippet children(startEdit)}
      <UnscheduledTaskContainer day={firstDayInRange} />
      <ResizeHandle on:mousedown={startEdit} />
    {/snippet}
  </ResizeableBox>
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

  :global(.timeline-box) {
    display: flex;
    flex-direction: column;
  }
</style>
