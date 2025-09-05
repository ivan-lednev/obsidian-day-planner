<script lang="ts">
  import { EllipsisVertical } from "lucide-svelte";
  import { Menu } from "obsidian";

  import { dataviewDownloadLink } from "../../constants";
  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { isToday } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";

  import Callout from "./callout.svelte";
  import ControlButton from "./control-button.svelte";
  import {
    Settings,
    ChevronLeft,
    ChevronRight,
    CalendarArrowUp,
  } from "./lucide";
  import Pill from "./pill.svelte";
  import SettingsControls from "./settings-controls.svelte";

  const {
    workspaceFacade,
    initWeeklyView,
    dataviewLoaded,
    reSync,
    periodicNotes,
  } = getObsidianContext();
  const dateRange = getDateRangeContext();

  let settingsVisible = $state(false);

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }

  function goToToday() {
    $dateRange = [window.moment()];
  }

  async function goBack() {
    const previousDay = $dateRange[0].clone().subtract(1, "day");

    $dateRange = [previousDay];
  }

  async function goForward() {
    const nextDay = $dateRange[0].clone().add(1, "day");

    $dateRange = [nextDay];
  }

  async function goToNoteForToday() {
    const noteForToday = await periodicNotes.createDailyNoteIfNeeded(
      window.moment(),
    );

    await workspaceFacade.openFileInEditor(noteForToday);
  }

  function handleReSyncClick(event: MouseEvent) {
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
        .setTitle("Open today's daily note")
        .setIcon("pencil")
        .onClick(goToNoteForToday);
    });

    menu.showAtMouseEvent(event);
  }
</script>

<div class="controls">
  <div class="header">
    <div class="buttons-left">
      <ControlButton onclick={handleReSyncClick}>
        <EllipsisVertical class="svg-icon" />
      </ControlButton>
      <ControlButton label="Go to today" onclick={goToToday}>
        <CalendarArrowUp />
      </ControlButton>
      <ControlButton label="Go to previous day" onclick={goBack}>
        <ChevronLeft />
      </ControlButton>
      <ControlButton label="Go to next day" onclick={goForward}>
        <ChevronRight />
      </ControlButton>
    </div>

    <ControlButton
      label="Go to file"
      onclick={async () => {
        const note = await periodicNotes.createDailyNoteIfNeeded($dateRange[0]);

        await workspaceFacade.openFileInEditor(note);
      }}
    >
      <span class="date">
        {#if $isToday($dateRange[0])}
          🔵
        {/if}

        {$dateRange[0].format($settings.timelineDateFormat)}</span
      >
    </ControlButton>

    <div class="buttons-right">
      <ControlButton
        isActive={settingsVisible}
        label="Settings"
        onclick={toggleSettings}
      >
        <Settings />
      </ControlButton>
    </div>
  </div>

  {#if $settings.dataviewSource}
    <div class="pill-wrapper">
      <Pill
        key="filter"
        onpointerup={() => {
          settingsVisible = true;
        }}
        value={$settings.dataviewSource}
      />
    </div>
  {/if}

  {#if !$dataviewLoaded}
    <Callout type="error">
      <span>
        You need to install and enable
        <a href={dataviewDownloadLink}>Dataview</a>
      </span>
    </Callout>
  {/if}

  {#if settingsVisible}
    <div class="settings-wrapper">
      <SettingsControls />
    </div>
  {/if}
</div>

<style>
  :global(.active-filter) {
    color: var(--text-success);
  }

  :global(.today),
  :global(.today:hover) {
    background-color: var(--color-accent);
  }

  .date {
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }

  :global(.mod-error) {
    color: var(--text-error);
  }

  .buttons-left {
    display: flex;
  }

  .header,
  .buttons-left {
    gap: var(--size-2-1);
  }

  .header {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    padding-right: var(--size-4-3);
  }

  .header > :global(*):last-child {
    justify-self: end;
  }

  .controls {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);

    padding: var(--size-4-2) 0 var(--size-4-2) var(--size-4-3);

    font-size: var(--font-ui-small);
  }

  .settings-wrapper {
    overflow: scroll;
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);
  }

  .settings-wrapper > :global(*) {
    padding-right: var(--size-4-1);
  }
</style>
