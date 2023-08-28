<script lang="ts">
  import { ArrowLeftToLine, ArrowRightToLine } from "lucide-svelte";
  import { get } from "svelte/store";
  import { isNotVoid } from "typed-assert";

  import { dateRange } from "../../store/date-range";
  import { getNotesForDays } from "../../util/daily-notes";
  import { getDaysOfWeek } from "../../util/moment";
  import {
    refreshPlanItemsInStoreWithRange,
  } from "../../util/obsidian";

  import ControlButton from "./control-button.svelte";

  async function handleShowPrevious() {
    const firstDayOfShownWeek = get(dateRange).dates[0];

    isNotVoid(firstDayOfShownWeek);

    const firstDayOfPreviousWeek = firstDayOfShownWeek
      .clone()
      .subtract(1, "week");
    const daysOfPreviousWeek = getDaysOfWeek(firstDayOfPreviousWeek);
    const notesOfPreviousWeek = getNotesForDays(daysOfPreviousWeek);

    const newRange = {
      dates: daysOfPreviousWeek,
      dailyNotes: notesOfPreviousWeek,
    };

    // workaround for store order
    await refreshPlanItemsInStoreWithRange(newRange);

    dateRange.set(newRange);
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
