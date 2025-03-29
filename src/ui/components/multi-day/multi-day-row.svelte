<script lang="ts">
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../../context/date-range-context";
  import { getObsidianContext } from "../../../context/obsidian-context";
  import UnscheduledTimeBlock from "../unscheduled-time-block.svelte";

  const {
    editContext: { getDisplayedTasksForTimeline },
  } = getObsidianContext();

  const dateRange = getDateRangeContext();
</script>

<div class="multi-day-row">
  {#each $dateRange as day, dayIndex}
    {@const tasks = fromStore(getDisplayedTasksForTimeline(day))}

    {#each tasks.current.noTime as task}
      <UnscheduledTimeBlock
        --time-block-grid-column="{dayIndex + 1} / span {Math.random() > 0.5
          ? 1
          : 3}"
        {task}
      />
    {/each}
  {/each}
</div>

<style>
  .multi-day-row {
    display: grid;
    grid-auto-flow: column;

    /* TODO: move to CSS variables */
    grid-template-columns: repeat(7, 200px);
    border-bottom: 1px solid var(--background-modifier-border);
  }
</style>
