<script lang="ts">
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../../context/date-range-context";
  import { getObsidianContext } from "../../../context/obsidian-context";
  import type { Task, WithTime } from "../../../task-types";
  import { isLocal, type RemoteTask } from "../../../task-types";
  import { isWithTime } from "../../../util/task-utils";
  import * as t from "../../../util/task-utils";
  import UnscheduledTimeBlock from "../unscheduled-time-block.svelte";

  const {
    editContext: { getDisplayedTasksForMultiDayRow },
  } = getObsidianContext();

  const dateRange = getDateRangeContext();
  const dateRangeSignal = fromStore(dateRange);

  // todo: remove store wrappers
  const tasks = $derived(
    getDisplayedTasksForMultiDayRow({
      start: dateRangeSignal.current[0],
      end: dateRangeSignal.current[dateRangeSignal.current.length - 1],
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
    <!--TODO: move out to a filter function-->
    {#if task.isAllDayEvent}
      <UnscheduledTimeBlock
        --time-block-grid-column="{getColumnIndex(task)} / span {getSpan(task)}"
        {task}
      />
    {/if}
  {/each}
</div>

<style>
  .multi-day-row {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: repeat(7, minmax(var(--cell-flex-basis), 1fr)) var(
        --scrollbar-width
      );
    flex: 1 0 0;

    border-bottom: 1px solid var(--background-modifier-border);
  }
</style>
