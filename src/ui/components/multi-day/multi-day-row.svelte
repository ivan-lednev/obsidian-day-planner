<script lang="ts">
  import { fromStore } from "svelte/store";
  import type { Task, WithTime } from "../../../task-types";

  import { getDateRangeContext } from "../../../context/date-range-context";
  import { getObsidianContext } from "../../../context/obsidian-context";
  import UnscheduledTimeBlock from "../unscheduled-time-block.svelte";
  import { isLocal, type RemoteTask } from "../../../task-types";
  import { isWithTime } from "../../../util/task-utils";
  import * as t from "../../../util/task-utils";

  const {
    editContext: { getDisplayedTasksForTimeline },
  } = getObsidianContext();

  const dateRange = getDateRangeContext();

  function getDaySpanFromDurationMinutes(remoteTask: WithTime<RemoteTask>) {
    return t.getEndTime(remoteTask).diff(remoteTask.startTime, "days");
  }

  function getSpan(task: Task) {
    if (isLocal(task) || !isWithTime(task)) {
      return 1;
    }

    return getDaySpanFromDurationMinutes(task);
  }
</script>

<div class="multi-day-row">
  {#each $dateRange as day, dayIndex}
    {@const tasks = fromStore(getDisplayedTasksForTimeline(day))}

    {#each tasks.current.noTime as task}
      <UnscheduledTimeBlock
        --time-block-grid-column="{dayIndex + 1} / span {getSpan(task)}"
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
