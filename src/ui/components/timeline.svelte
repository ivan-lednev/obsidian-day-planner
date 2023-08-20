<script lang="ts">
  import Ruler from "./ruler.svelte";
  import Column from "./column.svelte";
  import Needle from "./needle.svelte";
  import TaskContainer from "./task-container.svelte";
  import Controls from "./controls.svelte";
  import { activeDayShown, visibleHours } from "../../store/timeline-store";

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
  class="scroller"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="scale-with-days">
    <Ruler visibleHours={$visibleHours} />
    <Column visibleHours={$visibleHours}>
      {#if $activeDayShown}
        <Needle scrollBlockedByUser={userHoversOverScroller} />
      {/if}
      <TaskContainer />
    </Column>
  </div>
</div>

<style>
  .scroller {
    overflow: auto;
    height: 100%;
  }

  .scale-with-days {
    display: flex;
  }
</style>
