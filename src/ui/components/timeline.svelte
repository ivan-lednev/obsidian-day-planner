<script lang="ts">
  import { setContext } from "svelte";

  import { visibleHours } from "../../global-store/settings-utils";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type { ObsidianFacade } from "../../service/obsidian-facade";
  import type { ObsidianContext, OnUpdateFn } from "../../types";
  import { isToday } from "../../util/moment";

  import Column from "./column.svelte";
  import Controls from "./controls.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import TaskContainer from "./task-container.svelte";

  export let obsidianFacade: ObsidianFacade;
  export let onUpdate: OnUpdateFn;

  // todo: push this outside
  setContext<ObsidianContext>("obsidian", {
    obsidianFacade,
    onUpdate,
  });

  let userHoversOverScroller = false;

  function handleMouseEnter() {
    userHoversOverScroller = true;
  }

  function handleMouseLeave() {
    userHoversOverScroller = false;
  }
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
      <TaskContainer day={visibleDayInTimeline} />
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
