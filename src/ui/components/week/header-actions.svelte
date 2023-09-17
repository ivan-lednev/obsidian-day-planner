<script lang="ts">
  import {
    ArrowLeftToLine,
    ArrowRightToLine,
    CircleDotIcon,
  } from "lucide-svelte";

  import { visibleDateRange } from "../../../global-store/visible-date-range";
  import { getDaysOfCurrentWeek, getDaysOfWeek } from "../../../util/moment";
  import ControlButton from "../control-button.svelte";

  $: firstDayOfShownWeek = $visibleDateRange[0];
  $: startOfRange = firstDayOfShownWeek.format("MMM, D");
  $: endOfRange = $visibleDateRange.at(-1).format("MMM, D");

  function handleShowPrevious() {
    const firstDayOfPreviousWeek = firstDayOfShownWeek
      .clone()
      .subtract(1, "week");
    const daysOfPreviousWeek = getDaysOfWeek(firstDayOfPreviousWeek);

    visibleDateRange.set(daysOfPreviousWeek);
  }

  function handleShowCurrent() {
    visibleDateRange.set(getDaysOfCurrentWeek());
  }

  function handleShowNext() {
    const firstDayOfNextWeek = firstDayOfShownWeek.clone().add(1, "week");
    const daysOfNextWeek = getDaysOfWeek(firstDayOfNextWeek);

    visibleDateRange.set(daysOfNextWeek);
  }
</script>

<div class="view-header-nav-buttons">
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
  .range {
    flex: 1 0 0;
    margin-right: 10px;
    white-space: nowrap;
  }
</style>
