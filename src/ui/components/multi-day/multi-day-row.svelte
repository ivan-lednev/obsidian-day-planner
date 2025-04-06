<script lang="ts">
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../../context/date-range-context";
  import { getObsidianContext } from "../../../context/obsidian-context";
  import type { Task, WithTime } from "../../../task-types";
  import { isLocal, type RemoteTask } from "../../../task-types";
  import * as t from "../../../util/task-utils";
  import UnscheduledTimeBlock from "../unscheduled-time-block.svelte";

  const { editContext } = getObsidianContext();
  const getDisplayedAllDayTasksForMultiDayRow = fromStore(
    editContext.getDisplayedAllDayTasksForMultiDayRow,
  );

  const dateRange = fromStore(getDateRangeContext());
  const firstDayInRange = $derived(dateRange.current[0]);

  const displayedAllDayTasks = $derived(
    getDisplayedAllDayTasksForMultiDayRow.current({
      start: firstDayInRange,
      end: dateRange.current[dateRange.current.length - 1],
    }),
  );

  function getDaySpanFromDurationMinutes(remoteTask: WithTime<RemoteTask>) {
    return t.getEndTime(remoteTask).diff(remoteTask.startTime, "days");
  }

  function getSpan(task: Task) {
    if (isLocal(task) || !t.isWithTime(task)) {
      return 1;
    }

    return getDaySpanFromDurationMinutes(task);
  }

  function getColumnIndex(task: Task) {
    const foundIndex = dateRange.current.findIndex((date) =>
      date.isSame(task.startTime, "day"),
    );

    if (foundIndex > -1) {
      return foundIndex + 1;
    }

    // the task starts before the first day in the range
    return 1;
  }
</script>

<div style:--column-count={dateRange.current.length} class="multi-day-row">
  {#each displayedAllDayTasks as task (t.getRenderKey(task))}
    <UnscheduledTimeBlock
      --time-block-grid-column="{getColumnIndex(task)} / span {getSpan(task)}"
      {task}
    />
  {/each}
</div>

<style>
  .multi-day-row {
    position: relative;

    display: grid;
    grid-auto-flow: column;
    grid-template-columns: repeat(
      var(--column-count),
      minmax(var(--cell-flex-basis), 1fr)
    );
    flex: 1 0 0;
    align-self: flex-start;
  }
</style>
