<script lang="ts">
  import Ruler from "./ruler.svelte";
  import Column from "./column.svelte";
  import Needle from "./needle.svelte";
  import TaskContainer from "./task-container.svelte";
  import Controls from "./controls.svelte";
  import { startHour, tasks, weeklyTasks } from "../../store/timeline-store";

  let userHoversOverScroller = false;

  function handleMouseEnter() {
    userHoversOverScroller = true;
  }

  function handleMouseLeave() {
    userHoversOverScroller = false;
  }

  $: visibleHours = Array.from({ length: 24 })
    .map((value, index) => index)
    .slice($startHour);
</script>

<Controls />
<div
  class="scroller"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="scale-with-days">
    <Ruler {visibleHours} />
    {#each $weeklyTasks as tasksForDay}
      <Column {visibleHours}>
        {#if tasksForDay.isToday}
          <Needle scrollBlockedByUser={userHoversOverScroller} />
        {/if}
        <TaskContainer tasks={tasksForDay.tasks} />
      </Column>
    {/each}
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
