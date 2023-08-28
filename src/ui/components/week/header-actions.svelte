<script lang="ts">
  import { ArrowLeftToLine, ArrowRightToLine } from "lucide-svelte";

  import { visibleDateRange } from "../../../store/visible-date-range";
  import { getDaysOfWeek } from "../../../util/moment";
  import ControlButton from "../control-button.svelte";

  $: firstDayOfShownWeek = $visibleDateRange[0];

  async function handleShowPrevious() {
    const firstDayOfPreviousWeek = firstDayOfShownWeek
      .clone()
      .subtract(1, "week");
    const daysOfPreviousWeek = getDaysOfWeek(firstDayOfPreviousWeek);

    visibleDateRange.set(daysOfPreviousWeek);
  }

  async function handleShowNext() {
    const firstDayOfNextWeek = firstDayOfShownWeek.clone().add(1, "week");
    const daysOfNextWeek = getDaysOfWeek(firstDayOfNextWeek);

    visibleDateRange.set(daysOfNextWeek);
  }
</script>

<div class="view-header-nav-buttons">
  <ControlButton label="Show previous week" on:click={handleShowPrevious}>
    <ArrowLeftToLine class="svg-icon" />
  </ControlButton>

  <ControlButton label="Show next week" on:click={handleShowNext}>
    <ArrowRightToLine class="svg-icon" />
  </ControlButton>
</div>
