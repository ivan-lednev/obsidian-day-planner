<script lang="ts">
  import { range } from "lodash/fp";
  import {
    Settings,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Info,
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
  import { useDataviewSource } from "../hooks/use-dataview-source";

  import ControlButton from "./control-button.svelte";
  import ErrorReport from "./error-report.svelte";
  import Dropdown from "./obsidian/dropdown.svelte";
  import SettingItem from "./obsidian/setting-item.svelte";
  import Pill from "./pill.svelte";

  const {
    workspaceFacade,
    initWeeklyView,
    refreshTasks,
    dataviewLoaded,
    reSync,
  } = getContext<ObsidianContext>(obsidianContext);
  const dateRange = getContext<Writable<Moment[]>>(dateRangeContextKey);

  const {
    sourceIsEmpty,
    errorMessage: dataviewErrorMessage,
    dataviewSourceInput,
  } = useDataviewSource({ refreshTasks });

  const startHourOptions = range(0, 13).map(String);
  const zoomLevelOptions = range(1, 9).map(String);

  let settingsVisible = false;

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

  function handleStartHourInput(event: Event) {
    // @ts-expect-error
    $settings.startHour = Number(event.currentTarget.value);
  }

  function handleZoomLevelInput(event: Event) {
    // @ts-expect-error
    $settings.zoomLevel = Number(event.currentTarget.value);
  }
</script>

<div class="controls">
  <ErrorReport />
  <div class="header">
    <ControlButton
      onclick={(event: MouseEvent) => {
        const menu = new Menu();

        menu.addItem((item) =>
          item
            .setTitle("Re-sync internet calendars")
            .setIcon("sync")
            .onClick(reSync),
        );

        menu.addItem((item) =>
          item
            .setTitle("Open week planner")
            .setIcon("table")
            .onClick(initWeeklyView),
        );

        menu.addItem((item) => {
          item
            .setTitle("Open today's daily note")
            .setIcon("pencil")
            .onClick(goToToday);
        });

        menu.showAtMouseEvent(event);
      }}
    >
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
        <span class="date"
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
    <div class="stretcher">
      Include additional files, folders and tags with a Dataview source:
      <input
        placeholder={`-#archived and -"notes/personal"`}
        spellcheck="false"
        type="text"
        bind:value={$dataviewSourceInput}
      />
      {#if $sourceIsEmpty}
        <div class="info-container">
          <AlertTriangle class="svg-icon" />
          Tasks are pulled only from daily notes
        </div>
      {/if}
      {#if $dataviewErrorMessage.length > 0}
        <div class="info-container">
          <pre class="error-message">{$dataviewErrorMessage}</pre>
        </div>
      {/if}
      <div class="info-container">
        <Info class="svg-icon" />
        <a
          href="https://blacksmithgu.github.io/obsidian-dataview/reference/sources/"
          >Dataview source reference</a
        >
      </div>
    </div>
    <div class="settings">
      <SettingItem>
        <svelte:fragment slot="name">Start hour</svelte:fragment>
        <Dropdown
          slot="control"
          value={String($settings.startHour)}
          values={startHourOptions}
          on:input={handleStartHourInput}
        />
      </SettingItem>

      <SettingItem>
        <svelte:fragment slot="name">Zoom</svelte:fragment>
        <Dropdown
          slot="control"
          value={String($settings.zoomLevel)}
          values={zoomLevelOptions}
          on:input={handleZoomLevelInput}
        />
      </SettingItem>
      <SettingItem>
        <svelte:fragment slot="name">Auto-scroll to now</svelte:fragment>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          slot="control"
          class="checkbox-container mod-small"
          class:is-enabled={$settings.centerNeedle}
          onclick={() => {
            $settings.centerNeedle = !$settings.centerNeedle;
          }}
        >
          <input tabindex="0" type="checkbox" />
        </div>
      </SettingItem>

      <SettingItem>
        <svelte:fragment slot="name">Show completed tasks</svelte:fragment>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          slot="control"
          class="checkbox-container mod-small"
          class:is-enabled={$settings.showCompletedTasks}
          onclick={() => {
            $settings.showCompletedTasks = !$settings.showCompletedTasks;
          }}
        >
          <input tabindex="0" type="checkbox" />
        </div>
      </SettingItem>

      <SettingItem>
        <svelte:fragment slot="name"
          >Show subtasks in task blocks
        </svelte:fragment>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          slot="control"
          class="checkbox-container mod-small"
          class:is-enabled={$settings.showSubtasksInTaskBlocks}
          onclick={() => {
            // We create a new object to trigger immediate update in the timeline view
            settings.update((previous) => ({
              ...previous,
              showSubtasksInTaskBlocks: !previous.showSubtasksInTaskBlocks,
            }));
          }}
        >
          <input tabindex="0" type="checkbox" />
        </div>
      </SettingItem>

      <div class="controls-section">Unscheduled tasks</div>

      <SettingItem>
        <svelte:fragment slot="name">Show unscheduled tasks</svelte:fragment>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          slot="control"
          class="checkbox-container mod-small"
          class:is-enabled={$settings.showUncheduledTasks}
          onclick={() => {
            $settings.showUncheduledTasks = !$settings.showUncheduledTasks;
          }}
        >
          <input tabindex="0" type="checkbox" />
        </div>
      </SettingItem>

      {#if $settings.showUncheduledTasks}
        <SettingItem>
          <svelte:fragment slot="name"
            >Show unscheduled sub-tasks as separate blocks
          </svelte:fragment>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            slot="control"
            class="checkbox-container mod-small"
            class:is-enabled={$settings.showUnscheduledNestedTasks}
            onclick={() => {
              $settings.showUnscheduledNestedTasks =
                !$settings.showUnscheduledNestedTasks;
            }}
          >
            <input tabindex="0" type="checkbox" />
          </div>
        </SettingItem>
      {/if}
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

  .stretcher {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);

    font-size: var(--font-ui-small);
    color: var(--text-muted);
  }

  :global(.mod-error) {
    color: var(--text-error);
  }

  .stretcher input {
    font-family: var(--font-monospace);
  }

  .info-container {
    display: flex;
    gap: var(--size-4-1);
    margin: var(--size-4-2);
  }

  .info-container :global(.svg-icon) {
    flex-shrink: 0;
  }

  .error-message {
    overflow-x: auto;
    padding: var(--size-4-1);
    border: 1px solid var(--text-error);
    border-radius: var(--radius-s);
  }

  .controls-section {
    margin: var(--size-4-2) 0;
    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
  }

  .date {
    display: flex;
    align-items: center;
    justify-content: center;

    font-size: var(--font-ui-small);
    font-weight: var(--font-medium);
    color: var(--text-normal);
  }

  .settings {
    margin: var(--size-4-1) 0;
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
