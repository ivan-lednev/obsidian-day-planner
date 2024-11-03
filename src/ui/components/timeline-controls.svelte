<script lang="ts">
  import {
    Settings,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    EllipsisVertical,
  } from "lucide-svelte";
  import type { Moment } from "moment";
  import { Menu } from "obsidian";
  import { getContext } from "svelte";
  import type { Writable } from "svelte/store";

  import { dateRangeContextKey, obsidianContext } from "../../constants";
  import { isToday } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { ObsidianContext } from "../../types";
  import { createDailyNoteIfNeeded } from "../../util/daily-notes";

  import ControlButton from "./control-button.svelte";
  import ErrorReport from "./error-report.svelte";
  import Pill from "./pill.svelte";
  import SettingsControls from "./settings-controls.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const { workspaceFacade, initWeeklyView, dataviewLoaded, reSync, search } =
    getContext<ObsidianContext>(obsidianContext);
  const dateRange = getContext<Writable<Moment[]>>(dateRangeContextKey);

  const {
    editContext: {
      handlers: { handleUnscheduledTaskGripMouseDown },
    },
  } = getContext<ObsidianContext>(obsidianContext);

  let settingsVisible = $state(false);

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }

  async function goBack() {
    const previousDay = $dateRange[0].clone().subtract(1, "day");

    $dateRange = [previousDay];
  }

  async function goForward() {
    const nextDay = $dateRange[0].clone().add(1, "day");

    $dateRange = [nextDay];
  }

  async function goToToday() {
    const noteForToday = await createDailyNoteIfNeeded(window.moment());

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
        .onClick(goToToday);
    });

    menu.showAtMouseEvent(event);
  }
</script>

<div class="controls">
  <ErrorReport />
  <div class="header">
    <ControlButton onclick={handleReSyncClick}>
      <EllipsisVertical class="svg-icon" />
    </ControlButton>
    <div class="day-controls">
      <ControlButton label="Go to previous day" onclick={goBack}>
        <ChevronLeft class="svg-icon" />
      </ControlButton>

      <ControlButton
        classes={$isToday($dateRange[0]) ? "today" : ""}
        label="Go to file"
        onclick={async () => {
          const note = await createDailyNoteIfNeeded($dateRange[0]);
          await workspaceFacade.openFileInEditor(note);
        }}
      >
        <span class={`date ${$isToday($dateRange[0]) ? "today" : ""}`}
          >{$dateRange[0].format($settings.timelineDateFormat)}</span
        >
      </ControlButton>

      <ControlButton label="Go to next day" onclick={goForward}>
        <ChevronRight class="svg-icon" />
      </ControlButton>
    </div>

    <ControlButton
      isActive={settingsVisible}
      label="Settings"
      onclick={toggleSettings}
    >
      <Settings class="svg-icon" />
    </ControlButton>
  </div>
  <div>
    <Pill
      key="filter"
      onpointerup={() => {
        settingsVisible = true;
      }}
      value={$settings.dataviewSource}
    />
  </div>

  {#if !$dataviewLoaded}
    <div class="info-container">
      <AlertTriangle class="svg-icon mod-error" />
      <span
        >You need to install and enable
        <a href="https://github.com/blacksmithgu/obsidian-dataview">Dataview</a>
        for the day planner to work.</span
      >
    </div>
  {/if}

  {#if settingsVisible}
    <SettingsControls />
  {/if}

  <div class="search">
    <input
      bind:value={search.query}
      placeholder="Search"
      spellcheck="false"
      type="text"
    />
    <div class="search-results">
      {#each search.result as foundBlock}
        <UnscheduledTimeBlock
          onGripMouseDown={handleUnscheduledTaskGripMouseDown}
          onMouseUp={() => {}}
          task={foundBlock}
        />
      {/each}
    </div>
  </div>
</div>

<style>
  :global(.active-filter) {
    color: var(--text-success);
  }

  :global(.today),
  :global(.today:hover) {
    background-color: var(--color-accent);
  }

  .date.today {
    color: white;
  }

  :global(.mod-error) {
    color: var(--text-error);
  }

  .info-container {
    display: flex;
    gap: var(--size-4-1);
    margin: var(--size-4-2);
  }

  .info-container :global(.svg-icon) {
    flex-shrink: 0;
  }

  .date {
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }

  .controls {
    overflow: hidden;
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: var(--size-4-1);

    padding: var(--size-4-2);

    font-size: var(--font-ui-small);
  }

  .header {
    display: flex;
    justify-content: space-between;
  }

  .day-controls {
    display: flex;
    gap: var(--size-4-1);
    justify-content: space-between;
  }
</style>
