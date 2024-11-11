<script lang="ts">
  import {
    Settings,
    ChevronLeft,
    ChevronRight,
    EllipsisVertical,
  } from "lucide-svelte";
  import { PlaneTakeoff, Clock3 } from "lucide-svelte";
  import { Menu } from "obsidian";
  import { slide } from "svelte/transition";

  import { dataviewDownloadLink } from "../../constants";
  import { getDateRangeContext } from "../../context/date-range-context";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { isToday } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { LocalTask } from "../../task-types";
  import { createDailyNoteIfNeeded } from "../../util/daily-notes";
  import { getMinutesSinceMidnight } from "../../util/moment";
  import * as t from "../../util/task-utils";

  import BlockList from "./block-list.svelte";
  import Callout from "./callout.svelte";
  import ControlButton from "./control-button.svelte";
  import { createSlide } from "./defaults";
  import Tree from "./obsidian/tree.svelte";
  import Pill from "./pill.svelte";
  import Search from "./search.svelte";
  import SettingsControls from "./settings-controls.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const { workspaceFacade, initWeeklyView, dataviewLoaded, reSync } =
    getObsidianContext();
  const dateRange = getDateRangeContext();

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

  const dummy = [
    t.create({
      day: window.moment(),
      startMinutes: getMinutesSinceMidnight(window.moment()),
      settings: $settings,
      status: "x",
    }),
    t.create({
      day: window.moment(),
      startMinutes: getMinutesSinceMidnight(window.moment()),
      settings: $settings,
      status: " ",
      text: "- [ ] dummy clock\n      [🕒::2023-01-01 12:00:00]",
    }),
  ];
</script>

<div class="controls">
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

  <!--TODO: use real list for flair-->
  <Tree flair={String(dummy?.length)} title="Active clocks">
    <BlockList
      --search-results-bg-color="var(--background-primary)"
      list={dummy}
    >
      {#snippet match(task: LocalTask)}
        <UnscheduledTimeBlock
          --time-block-padding="var(--size-4-1)"
          onGripMouseDown={() => {}}
          onpointerup={() => {}}
          {task}
        >
          <div class="properties-wrapper">
            <Pill key={PlaneTakeoff} value="12:05" />
            <Pill key={Clock3} value="02:00" />
          </div>
        </UnscheduledTimeBlock>
      {/snippet}
    </BlockList>
  </Tree>

  <Tree title="Search">
    <Search
      --search-max-height="35vh"
      --search-results-bg-color="var(--background-primary)"
    />
  </Tree>
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
    display: flex;
    justify-content: space-between;
    padding-block: var(--size-4-2);
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

  .properties-wrapper {
    display: flex;
    gap: var(--size-4-1);
    align-items: center;
    padding: var(--size-4-1);
  }
</style>
