<script lang="ts">
  import { derived } from "svelte/store";

  import { getDateRangeContext } from "../../../context/date-range-context";
  import { getObsidianContext } from "../../../context/obsidian-context";
  import type { Task, WithTime } from "../../../task-types";
  import { isLocal, type RemoteTask } from "../../../task-types";
  import { isWithTime } from "../../../util/task-utils";
  import * as t from "../../../util/task-utils";
  import UnscheduledTimeBlock from "../unscheduled-time-block.svelte";

  const {
    editContext: { getDisplayedAllDayTasksForMultiDayRow },
  } = getObsidianContext();

  const dateRange = getDateRangeContext();

  const tasks = derived(
    [getDisplayedAllDayTasksForMultiDayRow, dateRange],
    ([$getTasks, $range]) =>
      $getTasks({
        start: $range[0],
        end: $range[$range.length - 1],
      }),
  );

  function getDaySpanFromDurationMinutes(remoteTask: WithTime<RemoteTask>) {
    return t.getEndTime(remoteTask).diff(remoteTask.startTime, "days");
  }

  function getSpan(task: Task) {
    if (isLocal(task) || !isWithTime(task)) {
      return 1;
    }

    return getDaySpanFromDurationMinutes(task);
  }

  function getColumnIndex(task: Task) {
    const foundIndex = $dateRange.findIndex((date) =>
      date.isSame(task.startTime, "day"),
    );

    if (foundIndex > -1) {
      return foundIndex + 1;
    }

    // the task starts before the first day in the range
    return 1;
  }
</script>

<div class="multi-day-row">
  {#each $tasks as task}
    <UnscheduledTimeBlock
      --time-block-grid-column="{getColumnIndex(task)} / span {getSpan(task)}"
      {task}
    />
  {/each}
</div>

<style>
  .multi-day-row {
    --multi-day-row-columns: repeat(7, minmax(var(--cell-flex-basis), 1fr));

    position: relative;

    display: grid;
    grid-auto-flow: column;
    grid-template-columns: var(--multi-day-row-columns);
    flex: 1 0 0;
    align-self: flex-start;
  }
</style>
