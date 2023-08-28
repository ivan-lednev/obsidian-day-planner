<script lang="ts">
  import type { Moment } from "moment";
  import { getDateUID } from "obsidian-daily-notes-interface";

  import { planItemsByDateUid } from "../../store/tasks";
  import { visibleHours } from "../../store/timeline-store";
  import { DateRange, dateRange } from "../../store/week-notes";
  import { getNotesForDays } from "../../util/daily-notes";
  import { getDaysOfCurrentWeek, isToday } from "../../util/moment";
  import { openFileForDay } from "../../util/obsidian";

  import Column from "./column.svelte";
  import ControlButton from "./control-button.svelte";
  import GoToFileIcon from "./icons/go-to-file.svelte";
  import FilePlus from "./icons/plus-file.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import TaskContainer from "./task-container.svelte";

  async function openDailyNote(day: Moment) {
    await openFileForDay(day);
    dateRange.update((previous: DateRange) => ({
      ...previous,
      dailyNotes: getNotesForDays(getDaysOfCurrentWeek()),
    }));
  }
</script>

<div class="week-header">
  <div class="corner"></div>
  {#each $dateRange.dates as day, i}
    <div class="day-header" class:today={isToday(day)}>
      <ControlButton
        --justify-self="flex-start"
        label="Open note for day"
        on:click={async () => await openDailyNote(day)}
      >
        {#if $dateRange.dailyNotes[i]}
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
  {#each $dateRange.dates as day, i}
    {#if !$dateRange.dailyNotes[i]}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="day-column no-note"
        on:click={async () => await openDailyNote(day)}
      ></div>
    {:else}
      <div class="day-column">
        <div class="scale-with-days">
          <Column visibleHours={$visibleHours}>
            {#if isToday(day)}
              <Needle scrollBlockedByUser={false} />
            {/if}

            <TaskContainer
              {day}
              tasks={$planItemsByDateUid[getDateUID(day, "day")] || []}
            />
          </Column>
        </div>
      </div>
    {/if}
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

  .no-note {
    background-color: var(--background-secondary);
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
