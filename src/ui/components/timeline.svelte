<script lang="ts">
  import {
    getAllDailyNotes,
    getDailyNote,
  } from "obsidian-daily-notes-interface";

  import { visibleHours } from "../../global-stores/settings-utils";
  import { visibleDayInTimeline } from "../../global-stores/visible-day-in-timeline";
  import { addPlacing } from "../../overlap/overlap";
  import { isToday } from "../../util/moment";
  import type { ObsidianFacade } from "../../util/obsidian-facade";

  import Column from "./column.svelte";
  import Controls from "./controls.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import TaskContainer from "./task-container.svelte";

  export let obsidianFacade: ObsidianFacade;

  let userHoversOverScroller = false;

  function handleMouseEnter() {
    userHoversOverScroller = true;
  }

  function handleMouseLeave() {
    userHoversOverScroller = false;
  }

  $: tasksPromise = obsidianFacade.getPlanItemsFromFile(
    getDailyNote($visibleDayInTimeline, getAllDailyNotes()),
  );
</script>

<Controls day={$visibleDayInTimeline} {obsidianFacade}/>
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
      {#await tasksPromise then tasks}
        <TaskContainer
          day={$visibleDayInTimeline}
          {obsidianFacade}
          tasks={addPlacing(tasks)}
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
