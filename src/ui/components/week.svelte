<script lang="ts">
  import { todayIsShownInTimeline } from "../../store/active-day";
  import { visibleHours } from "../../store/timeline-store";
  import { getDaysOfCurrentWeek } from "../../util/moment";

  import Column from "./column.svelte";
  import Needle from "./needle.svelte";
  import Ruler from "./ruler.svelte";
  import TaskContainer from "./task-container.svelte";

  const daysOfCurrentWeek = getDaysOfCurrentWeek();
  const dayHeaders = daysOfCurrentWeek.map((moment) => ({
    dayOfWeek: moment.format("ddd"),
    dayOfMonth: moment.format("DD"),
  }));
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
  {#each dayHeaders as { dayOfMonth, dayOfWeek }}
    <div class="day-column">
      <div class="scale-with-days">
        <Column visibleHours={$visibleHours}>
          {#if $todayIsShownInTimeline}
            <Needle scrollBlockedByUser={false} />
          {/if}
          <TaskContainer />
        </Column>
      </div>
    </div>
  {/each}
</div>

<style>
  :root {
    --scrollbar-width: 12px;
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
    border-bottom: 1px solid var(--background-modifier-border);
    border-left: 1px solid var(--background-modifier-border);
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
