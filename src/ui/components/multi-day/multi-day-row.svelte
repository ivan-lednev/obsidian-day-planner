<script lang="ts">
  import { fromStore } from "svelte/store";

  import { getDateRangeContext } from "../../../context/date-range-context";
  import { getObsidianContext } from "../../../context/obsidian-context";
  import type { TimeBlock, WithDuration } from "../../../time-block-types";
  import { isLocal, type RemoteTimeBlock } from "../../../time-block-types";
  import * as t from "../../../util/time-block-utils";
  import UnscheduledTimeBlock from "../unscheduled-time-block.svelte";

  const { editContext } = getObsidianContext();
  const getDisplayedAllDayTimeBlocksForMultiDayRow = fromStore(
    editContext.getDisplayedAllDayTimeBlocksForMultiDayRow,
  );

  const dateRange = getDateRangeContext();
  const firstDayInRange = $derived(dateRange.first);
  const lastDayInRange = $derived(dateRange.last);

  const displayedAllDayTimeBlocks = $derived(
    getDisplayedAllDayTimeBlocksForMultiDayRow.current({
      start: firstDayInRange,
      end: lastDayInRange,
    }),
  );

  function getDaySpanFromDurationMinutes(
    remoteTimeBlock: WithDuration<RemoteTimeBlock>,
  ) {
    return t
      .getEndTime(remoteTimeBlock)
      .diff(remoteTimeBlock.startTime, "days");
  }

  function getSpan(timeBlock: TimeBlock) {
    if (isLocal(timeBlock) || !t.isWithDuration(timeBlock)) {
      return 1;
    }

    return getDaySpanFromDurationMinutes(timeBlock);
  }

  function getColumnIndex(timeBlock: TimeBlock) {
    const foundIndex = dateRange.current.findIndex((date) =>
      date.isSame(timeBlock.startTime, "day"),
    );

    if (foundIndex > -1) {
      return foundIndex + 1;
    }

    // the time block starts before the first day in the range
    return 1;
  }
</script>

<div style:--column-count={dateRange.current.length} class="multi-day-row">
  {#each displayedAllDayTimeBlocks as timeBlock (timeBlock.id)}
    <UnscheduledTimeBlock
      --time-block-grid-column="{getColumnIndex(timeBlock)} / span {getSpan(
        timeBlock,
      )}"
      {timeBlock}
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
