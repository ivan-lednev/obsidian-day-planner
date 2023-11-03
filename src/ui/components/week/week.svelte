<script lang="ts">
  import { getContext, setContext } from "svelte";
  import { writable } from "svelte/store";

  import { obsidianContext } from "../../../constants";
  import {
    getVisibleHours,
    snap,
  } from "../../../global-store/derived-settings";
  import { settings } from "../../../global-store/settings";
  import { visibleDateRange } from "../../../global-store/visible-date-range";
  import type { ObsidianContext } from "../../../types";
  import { isToday } from "../../../util/moment";
  import { useEditContext } from "../../hooks/use-edit/use-edit-context";
  import ControlButton from "../control-button.svelte";
  import Ruler from "../ruler.svelte";
  import TaskContainer from "../task-container.svelte";

  const { obsidianFacade, onUpdate, getTasksForDay, fileSyncInProgress } =
    getContext<ObsidianContext>(obsidianContext);
  const pointerOffsetY = writable(0);
  let el: HTMLDivElement;

  $: setContext(
    "editContext",
    useEditContext({
      obsidianFacade,
      onUpdate,
      getTasksForDay: $getTasksForDay,
      fileSyncInProgress,
      settings: $settings,
      pointerOffsetY,
    }),
  );
</script>

<svelte:document
  on:mousemove={(event) => {
    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;

    pointerOffsetY.set(snap(borderTopToPointerOffsetY, $settings.zoomLevel));
  }}
/>

<div class="week-header">
  <div class="corner"></div>
  {#each $visibleDateRange as day}
    <div class="day-header" class:today={isToday(day)}>
      <ControlButton
        --color={isToday(day) ? "white" : "var(--icon-color)"}
        label="Open note for day"
        on:click={async () => await obsidianFacade.openFileForDay(day)}
      >
        {day.format($settings.timelineDateFormat)}
      </ControlButton>
    </div>
  {/each}
</div>

<div class="day-columns">
  <Ruler visibleHours={getVisibleHours($settings)} />
  <div bind:this={el} style="display: contents; ">
    {#each $visibleDateRange as day}
      <div class="day-column">
        <div class="stretcher">
          <TaskContainer {day} hideControls />
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .corner {
    position: sticky;
    z-index: 100;
    top: 0;
    left: 0;

    flex: 0 0 var(--time-ruler-width);

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-top: none;
    border-left: none;
  }

  .day-columns {
    display: flex;
  }

  .day-column {
    display: flex;
    flex: 1 0 150px;
    flex-direction: column;

    background-color: var(--background-secondary);
    border-right: 1px solid var(--background-modifier-border);
  }

  .week-header {
    position: sticky;
    z-index: 10;
    top: 0;
    display: flex;
  }

  .day-header {
    overflow-x: hidden;
    flex: 1 0 150px;

    background-color: var(--background-primary);
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .today {
    color: white;
    background-color: var(--color-accent);
  }

  .stretcher {
    display: flex;
  }
</style>
