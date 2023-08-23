<script lang="ts">
  import { todayIsShownInTimeline } from "../../store/active-day";
  import { visibleHours } from "../../store/timeline-store";

  import Column from "./column.svelte";
  import Controls from "./controls.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import TaskContainer from "./task-container.svelte";


  let userHoversOverScroller = false;

  function handleMouseEnter() {
    userHoversOverScroller = true;
  }

  function handleMouseLeave() {
    userHoversOverScroller = false;
  }
</script>

<Controls />
<div
  class="vertical-scroller"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="scale-with-days">
    <Ruler visibleHours={$visibleHours} />
    <Column visibleHours={$visibleHours}>
      {#if $todayIsShownInTimeline}
        <Needle scrollBlockedByUser={userHoversOverScroller} />
      {/if}
      <TaskContainer />
    </Column>
  </div>
</div>

<style>
  .vertical-scroller {
    overflow: auto;
    height: 100%;
  }

  .scale-with-days {
    display: flex;
  }
</style>
