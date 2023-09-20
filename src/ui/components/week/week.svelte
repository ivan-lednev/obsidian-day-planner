<script lang="ts">
  import { getContext } from "svelte";
  import { writable } from "svelte/store";

  import { obsidianContext } from "../../../constants";
  import { visibleHours } from "../../../global-store/settings-utils";
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

<div class="week-header">
  <div class="corner"></div>
  {#each $visibleDateRange as day}
    <div class="day-header" class:today={isToday(day)}>
      <ControlButton
        --color={isToday(day) ? "white" : "var(--icon-color)"}
        label="Open note for day"
        on:click={async () => await obsidianFacade.openFileForDay(day)}
      >
        {day.format("MMM D, ddd")}
      </ControlButton>
    </div>
  {/each}
</div>
<div class="days">
  <Ruler visibleHours={$visibleHours} />
  {#each $visibleDateRange as day}
    <div class="day-column">
      <div class="scale-with-days">
        <Column visibleHours={$visibleHours}>
          {#if isToday(day)}
            <Needle autoScrollBlocked={true} />
          {/if}
          <TaskContainer day={writable(day)} />
        </Column>
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

  .days {
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
    flex: 1 0 150px;

    padding: 5px;

    background-color: var(--background-primary);
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .today {
    color: white;
    background-color: var(--color-accent);
  }

  .scale-with-days {
    display: flex;
  }
</style>
