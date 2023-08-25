<script lang="ts">
  import {
    createDailyNote,
    getAllDailyNotes,
    getDailyNote,
    getDateUID,
  } from "obsidian-daily-notes-interface";

  import { currentTime } from "../../store/time";
  import { taskLookup, visibleHours } from "../../store/timeline-store";
  import { getDaysOfCurrentWeek } from "../../util/moment";

  import Column from "./column.svelte";
  import FilePlus from "./icons/plus-file.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import TaskContainer from "./task-container.svelte";

  const daysOfCurrentWeek = getDaysOfCurrentWeek();
  const dayHeaders = daysOfCurrentWeek.map((moment) => ({
    dayOfWeek: moment.format("ddd"),
    dayOfMonth: moment.format("DD"),
  }));
  const dailyNotes = daysOfCurrentWeek.map((day) =>
    getDailyNote(day, getAllDailyNotes()),
  );
</script>

<div class="week-header">
  <div class="corner"></div>
  {#each dayHeaders as { dayOfMonth, dayOfWeek }}
    <div class="day-header">
      <div class="day-of-week">{dayOfWeek}</div>
      <div class="day-of-month">{dayOfMonth}</div>
    </div>
  {/each}
</div>
<div class="days">
  <Ruler visibleHours={$visibleHours} />
  {#each daysOfCurrentWeek as day, i}
    {#if !dailyNotes[i]}
      <div class="day-column no-note">
        <div class="create-container">
          <button
            on:click={async () => {
              await createDailyNote(day);
            }}
          >
            <FilePlus />
            Create file for day
          </button>
        </div>
      </div>
    {:else}
      <div class="day-column">
        <div class="scale-with-days">
          <Column visibleHours={$visibleHours}>
            {#if day.isSame($currentTime, "day")}
              <Needle scrollBlockedByUser={false} />
            {/if}

            <TaskContainer tasks={$taskLookup[getDateUID(day, "day")] || []} />
          </Column>
        </div>
      </div>
    {/if}
  {/each}
</div>

<style>
  .create-container {
    display: flex;
    justify-content: center;
  }

  .corner {
    position: sticky;
    z-index: 100;
    top: 0;
    left: 0;

    flex: 0 0 40px;

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
    position: relative;
    background-color: var(--background-secondary);
  }

  .week-header {
    position: sticky;
    z-index: 10;
    top: 0;
    display: flex;
  }

  .day-header {
    display: flex;
    flex: 1 0 150px;
    flex-direction: column;

    /* todo: move to var */
    gap: 5px;
    align-items: center;

    padding: 5px 0;

    background-color: var(--background-primary);
    border-right: 1px solid var(--background-modifier-border);
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .day-of-month {
    padding: 5px 10px;
    color: var(--background-primary);
    background-color: var(--color-accent);
    border-radius: var(--radius-s);

    /* todo: move to var */
  }

  .scale-with-days {
    display: flex;
  }
</style>
