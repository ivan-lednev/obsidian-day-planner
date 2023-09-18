<script lang="ts">
  import {
    getAllDailyNotes,
    getDailyNote,
  } from "obsidian-daily-notes-interface";
  import { derived } from "svelte/store";

  import { visibleHours } from "../../global-store/settings-utils";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import { addPlacing } from "../../overlap/overlap";
  import type { ObsidianFacade } from "../../service/obsidian-facade";
  import type { OnUpdateFn } from "../../types";
  import { isToday } from "../../util/moment";

  import Column from "./column.svelte";
  import Controls from "./controls.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import TaskContainer from "./task-container.svelte";

  export let obsidianFacade: ObsidianFacade;
  export let onUpdate: OnUpdateFn;

  let userHoversOverScroller = false;

  function handleMouseEnter() {
    userHoversOverScroller = true;
  }

  function handleMouseLeave() {
    userHoversOverScroller = false;
  }

  const parsedTasks = derived(
    visibleDayInTimeline,
    (v, set) => {
      const note = getDailyNote(v, getAllDailyNotes());
      obsidianFacade.getPlanItemsFromFile(note).then((v) => set(addPlacing(v)));
    },
    [],
  );
</script>

<Controls day={$visibleDayInTimeline} {obsidianFacade} />
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
      <TaskContainer
        day={$visibleDayInTimeline}
        {obsidianFacade}
        {onUpdate}
        tasks={$parsedTasks}
      />
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
