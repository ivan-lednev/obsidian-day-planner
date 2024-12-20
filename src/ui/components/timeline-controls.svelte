<script lang="ts">
  import { EllipsisVertical } from "lucide-svelte";
  import { Menu } from "obsidian";
  import { slide } from "svelte/transition";

  import { dataviewDownloadLink } from "../../constants";
  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { isToday } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import { createDailyNoteIfNeeded } from "../../util/daily-notes";

  import ActiveClocks from "./active-clocks.svelte";
  import Callout from "./callout.svelte";
  import ControlButton from "./control-button.svelte";
  import { createSlide } from "./defaults";
  import {
    Settings,
    ChevronLeft,
    ChevronRight,
    CalendarArrowUp,
  } from "./lucide";
  import Tree from "./obsidian/tree.svelte";
  import Pill from "./pill.svelte";
  import SettingsControls from "./settings-controls.svelte";

  const {
    workspaceFacade,
    initWeeklyView,
    dataviewLoaded,
    reSync,
    tasksWithActiveClockProps,
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
        .onClick(goToNoteForToday);
    });

    menu.showAtMouseEvent(event);
  }
</script>

<div class="controls">
  <div class="header">
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
    <ControlButton
      isActive={settingsVisible}
      label="Settings"
      onclick={toggleSettings}
    >
      <Settings />
    </ControlButton>
  </div>
  <div class="pill-wrapper">
    <Pill
      key="filter"
      onpointerup={() => {
        settingsVisible = true;
      }}
      value={$settings.dataviewSource}
    />
  </div>

  {#if !$dataviewLoaded}
    <Callout --callout-margin-inline="var(--size-4-3)" type="error">
      <span>
        You need to install and enable
        <a href={dataviewDownloadLink}>Dataview</a>
      </span>
    </Callout>
  {/if}

  {#if settingsVisible}
    <div transition:slide={createSlide({ axis: "y" })}>
      <SettingsControls />
    </div>
  {/if}

  <Tree
    flair={String($tasksWithActiveClockProps.length)}
    isInitiallyOpen
    title="Active clocks"
  >
    <ActiveClocks --search-results-bg-color="var(--background-primary)" />
  </Tree>

  <!--  <Tree title="Search">-->
  <!--    <Search-->
  <!--      &#45;&#45;search-max-height="35vh"-->
  <!--      &#45;&#45;search-results-bg-color="var(&#45;&#45;background-primary)"-->
  <!--    />-->
  <!--  </Tree>-->
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

  .pill-wrapper {
    padding-bottom: var(--size-4-2);
  }

  .pill-wrapper,
  .header {
    padding-inline: var(--size-4-3);
  }

  .header {
    --header-start-items-count: 5;

    display: grid;
    grid-template-columns: repeat(var(--header-start-items-count), auto) 1fr;
    gap: var(--size-2-1);
    padding-block: var(--size-4-2);
  }

  .header > :global(*):last-child {
    justify-self: end;
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

    font-size: var(--font-ui-small);
  }

  .day-controls {
    display: flex;
    gap: var(--size-4-1);
    justify-content: space-between;
  }
</style>
