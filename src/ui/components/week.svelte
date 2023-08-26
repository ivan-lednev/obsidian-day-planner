<script lang="ts">
  import type { Moment } from "moment";
  import { getDateUID } from "obsidian-daily-notes-interface";

  import { currentTime } from "../../store/time";
  import { taskLookup, visibleHours } from "../../store/timeline-store";
  import { getNotesForDays } from "../../util/daily-notes";
  import { getDaysOfCurrentWeek } from "../../util/moment";
  import { openFileForDay } from "../../util/obsidian";

  import Column from "./column.svelte";
  import ControlButton from "./control-button.svelte";
  import GoToFileIcon from "./icons/go-to-file.svelte";
  import FilePlus from "./icons/plus-file.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import TaskContainer from "./task-container.svelte";

  const daysOfCurrentWeek = getDaysOfCurrentWeek();

  let dailyNotes = getNotesForDays(daysOfCurrentWeek);

  function isToday(moment: Moment) {
    return moment.isSame(window.moment(), "day");
  }
</script>

<div class="week-header">
  <div class="corner"></div>
  {#each daysOfCurrentWeek as day, i}
    <div class="day-header" class:today={isToday(day)}>
      <ControlButton
        --justify-self="flex-start"
        label="Open note for day"
        on:click={async () => await openFileForDay(day)}
      >
        {#if dailyNotes[i]}
          <GoToFileIcon />
        {:else}
          <FilePlus />
        {/if}
      </ControlButton>
      <div class="day-header-date">
        {day.format("DD, ddd")}
      </div>
    </div>
  {/each}
</div>
<div class="days">
  <Ruler visibleHours={$visibleHours} />
  {#each daysOfCurrentWeek as day, i}
    {#if !dailyNotes[i]}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <div
        class="day-column no-note"
        on:click={async () => await openFileForDay(day)}
      ></div>
    {:else}
      <div class="day-column">
        <div class="scale-with-days">
          <Column visibleHours={$visibleHours}>
            {#if day.isSame($currentTime, "day")}
              <Needle scrollBlockedByUser={false} />
            {/if}

            <TaskContainer
              {day}
              tasks={$taskLookup[getDateUID(day, "day")] || []}
            />
          </Column>
        </div>
      </div>
    {/if}
  {/each}
</div>

<style>
  .day-header-date {
    justify-self: center;
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

    /* TODO: parameterize that */
    flex: 1 0 150px;
    flex-direction: column;
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
    grid-template-columns: 1fr 2fr 1fr;
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
