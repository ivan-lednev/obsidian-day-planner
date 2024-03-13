<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { getVisibleHours } from "../../../global-store/derived-settings";
  import { settings } from "../../../global-store/settings";
  import { visibleDateRange } from "../../../global-store/visible-date-range";
  import type { ObsidianContext } from "../../../types";
  import { isToday } from "../../../util/moment";
  import ControlButton from "../control-button.svelte";
  import Ruler from "../ruler.svelte";
  import TimelineWithControls from "../timeline-with-controls.svelte";
  import UnscheduledTaskContainer from "../unscheduled-task-container.svelte";

  const { obsidianFacade } = getContext<ObsidianContext>(obsidianContext);
</script>

<div class="week-header">
  <div class="header-row day-buttons">
    <div class="corner"></div>
    {#each $visibleDateRange as day}
      <div class="header-cell" class:today={isToday(day)}>
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

  <div class="header-row">
    <div class="corner"></div>
    {#each $visibleDateRange as day}
      <div class="header-cell">
        <UnscheduledTaskContainer {day} />
      </div>
    {/each}
  </div>
</div>

<div class="day-columns">
  <Ruler visibleHours={getVisibleHours($settings)} />
  {#each $visibleDateRange as day}
    <div class="day-column">
      <div class="stretcher">
        <!--    TODO: remove the wrapper    -->
        <TimelineWithControls {day} hideControls />
      </div>
    </div>
  {/each}
</div>

<style>
  .header-row {
    display: flex;
  }

  .day-buttons {
    font-size: var(--font-ui-small);
  }

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
    flex: 1 0 200px;
    flex-direction: column;

    background-color: var(--background-secondary);
    border-right: 1px solid var(--background-modifier-border);
  }

  .week-header {
    position: sticky;
    z-index: 10;
    top: 0;

    display: flex;
    flex-direction: column;
  }

  .header-cell {
    overflow-x: hidden;
    flex: 1 0 200px;

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
