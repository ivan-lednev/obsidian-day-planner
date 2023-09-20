<script lang="ts">
  import { range } from "lodash/fp";
  import {
    Settings,
    ArrowLeft,
    ArrowRight,
    FileInput,
    HelpCircle,
    Table2,
  } from "lucide-svelte";
  import type { Moment } from "moment";
  import { DEFAULT_DAILY_NOTE_FORMAT } from "obsidian-daily-notes-interface";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import { visibleDayInTimeline } from "../../global-store/visible-day-in-timeline";
  import type { ObsidianContext } from "../../types";
  import { createDailyNoteIfNeeded } from "../../util/daily-notes";

  import ControlButton from "./control-button.svelte";
  import Dropdown from "./obsidian/dropdown.svelte";
  import SettingItem from "./obsidian/setting-item.svelte";

  export let day: Moment;

  const { obsidianFacade, initWeeklyView } =
    getContext<ObsidianContext>(obsidianContext);

  const startHourOptions = range(0, 13).map(String);
  const zoomLevelOptions = range(1, 5).map(String);

  let settingsVisible = false;
  let helpVisible = false;

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }

  function toggleHelp() {
    helpVisible = !helpVisible;
  }

  async function goBack() {
    const previousDay = $visibleDayInTimeline.clone().subtract(1, "day");

    const previousNote = await createDailyNoteIfNeeded(previousDay);

    await obsidianFacade.openFileInEditor(previousNote);

    $visibleDayInTimeline = previousDay;
  }

  async function goForward() {
    const nextDay = $visibleDayInTimeline.clone().add(1, "day");

    const nextNote = await createDailyNoteIfNeeded(nextDay);

    await obsidianFacade.openFileInEditor(nextNote);

    $visibleDayInTimeline = nextDay;
  }

  async function goToToday() {
    const noteForToday = await createDailyNoteIfNeeded(window.moment());

    await obsidianFacade.openFileInEditor(noteForToday);
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
  <div class="header">
    <ControlButton label="Open today's daily note" on:click={goToToday}>
      <FileInput class="svg-icon" />
    </ControlButton>

    <ControlButton label="Open week planner" on:click={initWeeklyView}>
      <Table2 class="svg-icon" />
    </ControlButton>

    <ControlButton
      --grid-column-start="3"
      --justify-self="flex-end"
      label="Go to previous daily plan"
      on:click={goBack}
    >
      <ArrowLeft class="svg-icon" />
    </ControlButton>

    <ControlButton
      label="Go to file"
      on:click={async () => {
        const note = await createDailyNoteIfNeeded(day);
        await obsidianFacade.openFileInEditor(note);
      }}
    >
      <span class="date">{day.format(DEFAULT_DAILY_NOTE_FORMAT)}</span>
    </ControlButton>

    <ControlButton
      --justify-self="flex-start"
      label="Go to next daily plan"
      on:click={goForward}
    >
      <ArrowRight class="svg-icon" />
    </ControlButton>

    <ControlButton isActive={helpVisible} label="Help" on:click={toggleHelp}>
      <HelpCircle class="svg-icon" />
    </ControlButton>
    <ControlButton
      isActive={settingsVisible}
      label="Settings"
      on:click={toggleSettings}
    >
      <Settings class="svg-icon" />
    </ControlButton>
  </div>
  {#if helpVisible}
    <p class="help-item"><strong>Advanced editing:</strong></p>
    <p class="help-item">Hold <strong>Shift</strong> and drag to copy</p>
    <p class="help-item">
      Hold <strong>Control</strong> and drag/resize to push neighboring tasks
    </p>
  {/if}
  {#if settingsVisible}
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
          on:click={() => {
            $settings.centerNeedle = !$settings.centerNeedle;
          }}
        >
          <input tabindex="0" type="checkbox" />
        </div>
      </SettingItem>

      <SettingItem>
        <svelte:fragment slot="name">Show help while dragging</svelte:fragment>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
          slot="control"
          class="checkbox-container mod-small"
          class:is-enabled={$settings.showHelp}
          on:click={() => {
            $settings.showHelp = !$settings.showHelp;
          }}
        >
          <input tabindex="0" type="checkbox" />
        </div>
      </SettingItem>
    </div>
  {/if}
</div>

<style>
  .help-item {
    margin: var(--size-2-3) var(--size-4-4);
    font-size: var(--font-ui-small);
    color: var(--text-muted);
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
    margin: var(--size-4-1) var(--size-4-4);
  }

  .controls {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .header {
    display: grid;
    grid-template-columns: repeat(2, var(--size-4-8)) repeat(3, 1fr) repeat(
        2,
        var(--size-4-8)
      );
    margin: var(--size-4-2);
  }
</style>
