<script lang="ts">
  import type { Moment } from "moment";
  import {
    getAllDailyNotes,
    getDailyNote,
  } from "obsidian-daily-notes-interface";

  import { visibleHours } from "../../../store/timeline-store";
  import { visibleDateRange } from "../../../store/visible-date-range";
  import { isToday } from "../../../util/moment";
  import {
    getPlanItemsFromFile,
    openFileForDay,
    toPlacedWritables,
  } from "../../../util/obsidian";
  import Column from "../column.svelte";
  import ControlButton from "../control-button.svelte";
  import GoToFileIcon from "../icons/go-to-file.svelte";
  import FilePlus from "../icons/plus-file.svelte";
  import Needle from "../needle.svelte";
  import Ruler from "../ruler.svelte";
  import TaskContainer from "../task-container.svelte";

  async function openDailyNote(day: Moment) {
    await openFileForDay(day);

    // todo: this is a hack to trigger updates
    visibleDateRange.update((previous) => [...previous]);
  }
</script>

<div class="week-header">
  <div class="corner"></div>
  {#each $visibleDateRange as day}
    <div class="day-header" class:today={isToday(day)}>
      <ControlButton
        --justify-self="flex-start"
        label="Open note for day"
        on:click={async () => await openDailyNote(day)}
      >
        {#if getDailyNote(day, getAllDailyNotes())}
          <GoToFileIcon />
        {:else}
          <FilePlus />
        {/if}
      </ControlButton>
      <div class="day-header-date">
        {day.format("MMM D, ddd")}
      </div>
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
            <Needle scrollBlockedByUser={false} />
          {/if}

          {#await getPlanItemsFromFile(getDailyNote(day, getAllDailyNotes()))}
            <pre>...</pre>
          {:then tasks}
            <TaskContainer {day} tasks={toPlacedWritables(tasks)} />
          {:catch error}
            <pre>Could not render tasks: {error}</pre>
          {/await}
        </Column>
      </div>
    </div>
  {/each}
</div>

<style>
  .day-header-date {
    justify-self: flex-start;
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
    display: grid;
    grid-template-columns: 1fr 3fr;
    flex: 1 0 150px;

    /* todo: move to var */
    gap: 5px;
    align-items: center;

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
