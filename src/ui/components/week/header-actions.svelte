<script lang="ts">
  import { ArrowLeftToLine, ArrowRightToLine } from "lucide-svelte";
  import { isNotVoid } from "typed-assert";

  import { visibleDateRange } from "../../../store/visible-date-range";
  import { getDaysOfWeek } from "../../../util/moment";
  import ControlButton from "../control-button.svelte";

  async function handleShowPrevious() {
    const firstDayOfShownWeek = $visibleDateRange[0];

    isNotVoid(firstDayOfShownWeek);

    const firstDayOfPreviousWeek = firstDayOfShownWeek
      .clone()
      .subtract(1, "week");
    const daysOfPreviousWeek = getDaysOfWeek(firstDayOfPreviousWeek);

    visibleDateRange.set(daysOfPreviousWeek);
  }
</script>

<div class="view-header-nav-buttons">
  <ControlButton label="Show previous week" on:click={handleShowPrevious}>
    <ArrowLeftToLine class="svg-icon" />
  </ControlButton>

  <ControlButton label="Show next week" on:click={() => {}}>
    <ArrowRightToLine class="svg-icon" />
  </ControlButton>
</div>
