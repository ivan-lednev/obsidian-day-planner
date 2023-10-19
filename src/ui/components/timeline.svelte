<script lang="ts">
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";

  import TaskContainer from "./task-container.svelte";
  import TimelineControls from "./timeline-controls.svelte";

  let userHoversOverScroller = false;

  function handleMouseEnter() {
    userHoversOverScroller = true;
  }

  function handleMouseLeave() {
    userHoversOverScroller = false;
  }
</script>

<TimelineControls day={$visibleDayInTimeline} />
<div
  class="scroller"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <TaskContainer day={$visibleDayInTimeline} />
</div>

<style>
  .scroller {
    overflow: auto;
    flex: 1 0 0;
  }

</style>
