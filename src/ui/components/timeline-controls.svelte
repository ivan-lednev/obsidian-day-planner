<script lang="ts">
  import { EllipsisVertical } from "lucide-svelte";
  import type { Moment } from "moment";
  import { Menu } from "obsidian";

  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { settings } from "../../global-store/settings";
  import { getFullWeek } from "../../util/range";
  import { createColumnSelectionMenu } from "../column-selection-menu";

  import ControlButton from "./control-button.svelte";
  import DayOfWeekPicker from "./day-of-week-picker.svelte";
  import { ChevronLeft, ChevronRight } from "./lucide";

  const {
    workspaceFacade,
    initWeeklyView,
    reSync,
    periodicNotes,
    openTimelineSettingsModal,
  } = getObsidianContext();
  const dateRange = getDateRangeContext();

  const { timeTracker, planner } = $derived($settings.timelineColumns);
  const selectedDay = $derived($dateRange[0]);
  const week = $derived(getFullWeek(selectedDay, $settings.firstDayOfWeek));

  function goToToday() {
    $dateRange = [window.moment()];
  }

  function goBack() {
    $dateRange = [selectedDay.clone().subtract(1, "week")];
  }

  function goForward() {
    $dateRange = [selectedDay.clone().add(1, "week")];
  }

  async function goToNoteForDay(day: Moment) {
    const note = await periodicNotes.createDailyNoteIfNeeded(day);

    await workspaceFacade.openFileInEditor(note);
  }

  async function handleDayClick(day: Moment) {
    if (day.isSame(selectedDay, "day")) {
      await goToNoteForDay(day);

      return;
    }

    $dateRange = [day];
  }

  function handleMenuClick(event: MouseEvent) {
    const menu = new Menu();

    menu.addItem((item) =>
      item
        .setTitle("Re-sync internet calendars")
        .setIcon("sync")
        .onClick(reSync),
    );

    menu.addItem((item) =>
      item
        .setTitle("Open multi-day planner")
        .setIcon("table-2")
        .onClick(initWeeklyView),
    );

    menu.addItem((item) => {
      item
        .setTitle("Open daily note for selected day")
        .setIcon("pencil")
        .onClick(() => goToNoteForDay(selectedDay));
    });

    menu.addSeparator();

    menu.addItem((item) =>
      item
        .setTitle("View settings")
        .setIcon("settings")
        .onClick(openTimelineSettingsModal),
    );

    menu.showAtMouseEvent(event);
  }
</script>

<div class="controls">
  <div class="header">
    <div class="buttons-left">
      <ControlButton label="Go to previous week" onclick={goBack}>
        <ChevronLeft />
      </ControlButton>
      <ControlButton
        classes="today-button"
        label="Go to today"
        onclick={goToToday}>Today</ControlButton
      >
      <ControlButton label="Go to next week" onclick={goForward}>
        <ChevronRight />
      </ControlButton>
    </div>

    <div class="period">
      <span class="month">{selectedDay.format("MMM")}</span>
      <span class="year">{selectedDay.format("YYYY")}</span>
    </div>

    <div class="buttons-right">
      <ControlButton
        class="control-text"
        label="Select visible columns"
        onclick={(event) => {
          createColumnSelectionMenu({ settings, event });
        }}
      >
        {#if planner && timeTracker}
          Planner | Tracker
        {:else if planner}
          Planner
        {:else if timeTracker}
          Tracker
        {/if}
      </ControlButton>
      <ControlButton label="More options" onclick={handleMenuClick}>
        <EllipsisVertical class="svg-icon" />
      </ControlButton>
    </div>
  </div>

  <DayOfWeekPicker onDayClick={handleDayClick} {selectedDay} {week} />
</div>

<style>
  :global(.mod-error) {
    color: var(--text-error);
  }

  .buttons-right,
  .buttons-left {
    display: flex;
    align-items: center;
  }

  .header,
  .buttons-left,
  .buttons-right {
    gap: var(--size-2-1);
  }

  .header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    padding-right: var(--size-4-3);
  }

  .buttons-right {
    justify-self: end;
  }

  .period {
    display: flex;
    gap: var(--size-2-1);
    justify-self: center;

    font-size: var(--font-ui-medium);
    font-weight: var(--font-semibold);
    white-space: nowrap;
  }

  .month {
    color: var(--text-normal);
  }

  .year {
    color: var(--color-accent);
  }

  .buttons-left :global(.today-button) {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-muted);
    text-transform: uppercase;
  }

  .controls {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);

    padding: var(--size-4-2) 0 var(--size-4-2) var(--size-4-3);

    font-size: var(--font-ui-small);
  }

  .controls :global(.control-text) {
    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }

  .controls :global(.control-text:hover) {
    color: var(--text-muted);
  }
</style>
