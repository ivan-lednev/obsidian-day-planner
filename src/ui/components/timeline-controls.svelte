<script lang="ts">
  import { EllipsisVertical } from "lucide-svelte";
  import type { Moment } from "moment";
  import { Menu } from "obsidian";

  import { getDateRangeContext } from "../../context/date-range-context";
  import { getIsInSidebarContext } from "../../context/is-in-sidebar-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { settingsStore } from "../../global-store/settings";
  import { getFullWeek } from "../../util/range";
  import { addTimelineViewMenuItems } from "../timeline-view-menu";

  import ControlButton from "./control-button.svelte";
  import DayOfWeekPicker from "./day-of-week-picker.svelte";
  import { ChevronLeft, ChevronRight } from "./lucide";

  const {
    workspaceFacade,
    periodicNotes,
    reSync,
    initWeeklyView,
    openTimelineSettingsModal,
  } = getObsidianContext();
  const dateRange = getDateRangeContext();
  const isInSidebar = getIsInSidebarContext();

  const selectedDay = $derived(dateRange.first);
  const week = $derived(
    getFullWeek(selectedDay, $settingsStore.firstDayOfWeek),
  );

  function goToToday() {
    dateRange.set([window.moment()]);
  }

  function goBack() {
    dateRange.set([selectedDay.clone().subtract(1, "week")]);
  }

  function goForward() {
    dateRange.set([selectedDay.clone().add(1, "week")]);
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

    dateRange.set([day]);
  }

  function handleMenuClick(event: MouseEvent) {
    const menu = new Menu();

    addTimelineViewMenuItems(menu, {
      reSync,
      initWeeklyView,
      openTimelineSettingsModal,
      settingsStore,
      openFileForDay: (day: Moment) => workspaceFacade.openFileForDay(day),
      getSelectedDay: () => selectedDay,
    });

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

    {#if $isInSidebar}
      <div class="period">{selectedDay.format("MMM YYYY")}</div>
      <div class="buttons-right">
        <ControlButton label="More options" onclick={handleMenuClick}>
          <EllipsisVertical class="svg-icon" />
        </ControlButton>
      </div>
    {/if}
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
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    padding-right: var(--size-4-3);
  }

  .buttons-right {
    grid-column: 3;
    justify-self: end;
  }

  .period {
    justify-self: center;

    font-family: var(--file-header-font);
    font-size: var(--file-header-font-size);
    font-weight: var(--font-medium);
    color: var(--text-muted);
    white-space: nowrap;
  }

  .buttons-left :global(.today-button) {
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-muted);
  }

  .controls {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);

    padding: var(--size-4-2) 0 var(--size-4-2) var(--size-4-3);

    font-size: var(--font-ui-small);
  }
</style>
