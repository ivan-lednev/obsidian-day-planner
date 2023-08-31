<script lang="ts">
  import {
    getAllDailyNotes,
    getDailyNote,
  } from "obsidian-daily-notes-interface";

  import { visibleHours } from "../../store/timeline-store";
  import { visibleDayInTimeline } from "../../store/visible-day-in-timeline";
  import { isToday } from "../../util/moment";
  import { getPlanItemsFromFile, toPlacedWritables } from "../../util/obsidian";

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

<Controls day={$visibleDayInTimeline} />
<div
  class="vertical-scroller"
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  <div class="scale-with-days">
    <Ruler visibleHours={$visibleHours} />
    <Column visibleHours={$visibleHours}>
      {#if isToday($visibleDayInTimeline)}
        <Needle autoScrollBlocked={userHoversOverScroller} />
      {/if}
      {#await getPlanItemsFromFile(getDailyNote($visibleDayInTimeline, getAllDailyNotes())) then tasks}
        <TaskContainer
          day={$visibleDayInTimeline}
          tasks={toPlacedWritables(tasks)}
        />
      {:catch error}
        <pre>Could not render tasks: {error}</pre>
      {/await}
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
