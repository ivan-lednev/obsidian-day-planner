<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { getVisibleHours } from "../../../global-store/derived-settings";
  import { settings } from "../../../global-store/settings";
  import { visibleDateRange } from "../../../global-store/visible-date-range";
  import type { ObsidianContext } from "../../../types";
  import { isToday } from "../../../util/moment";
  import Column from "../column.svelte";
  import ControlButton from "../control-button.svelte";
  import Needle from "../needle.svelte";
  import Ruler from "../ruler.svelte";
  import TaskContainer from "../task-container.svelte";

  const { obsidianFacade } = getContext<ObsidianContext>(obsidianContext);
</script>

<!--TODO: move to component-->
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

<!--TODO move to component-->
<div class="day-columns">
  <Ruler visibleHours={getVisibleHours($settings)} />
  {#each $visibleDateRange as day}
    <div class="day-column">
      <div class="stretcher">
        <TaskContainer hideRuler />
      </div>
    </div>
  {/each}
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
