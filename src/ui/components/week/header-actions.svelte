<script lang="ts">
  import {
    ArrowLeftToLine,
    ArrowRightToLine,
    CircleDotIcon,
  } from "lucide-svelte";
  import type { Moment } from "moment";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  import { dateRangeContextKey } from "../../../constants";
  import { settings } from "../../../global-store/settings";
  import { getDaysOfCurrentWeek, getDaysOfWeek } from "../../../util/moment";
  import ControlButton from "../control-button.svelte";
  import Pill from "../pill.svelte";

  const dateRange = getContext<Writable<Moment[]>>(dateRangeContextKey);

  $: firstDayOfShownWeek = $dateRange[0];
  $: startOfRange = firstDayOfShownWeek.format("MMM, D");
  $: endOfRange = $dateRange.at(-1)?.format("MMM, D") ?? "N/A";

  function handleShowPrevious() {
    const firstDayOfPreviousWeek = firstDayOfShownWeek
      .clone()
      .subtract(1, "week");
    const daysOfPreviousWeek = getDaysOfWeek(firstDayOfPreviousWeek);

    dateRange.set(daysOfPreviousWeek);
  }

  function handleShowCurrent() {
    dateRange.set(getDaysOfCurrentWeek());
  }

  function handleShowNext() {
    const firstDayOfNextWeek = firstDayOfShownWeek.clone().add(1, "week");
    const daysOfNextWeek = getDaysOfWeek(firstDayOfNextWeek);

    dateRange.set(daysOfNextWeek);
  }
</script>

<div class="view-header-nav-buttons">
  <Pill key="filter" value={$settings.dataviewSource} />
  <div class="range">
    {startOfRange} - {endOfRange}
  </div>
  <ControlButton label="Show previous week" on:click={handleShowPrevious}>
    <ArrowLeftToLine class="svg-icon" />
  </ControlButton>

  <ControlButton label="Show current week" on:click={handleShowCurrent}>
    <CircleDotIcon class="svg-icon" />
  </ControlButton>

  <ControlButton label="Show next week" on:click={handleShowNext}>
    <ArrowRightToLine class="svg-icon" />
  </ControlButton>
</div>

<style>
  .view-header-nav-buttons {
    display: flex;
    gap: var(--size-4-1);
  }

  .range {
    flex: 1 0 0;
    margin-right: 10px;
    white-space: nowrap;
  }
</style>
