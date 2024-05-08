<script lang="ts">
  import { range } from "lodash/fp";
  import {
    FileInput,
    Table2,
    AlertTriangle,
    Info,
    RefreshCw,
  } from "lucide-svelte";
  import { Moment } from "moment";
  import { getContext } from "svelte";
  import { Writable } from "svelte/store";

  import ButtonWithIcon from "./button-with-icon.svelte";
  import { dateRangeContextKey, obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import type { ObsidianContext } from "../../types";
  import { createDailyNoteIfNeeded } from "../../util/daily-notes";
  import { isToday } from "../../util/moment";
  import { useDataviewSource } from "../hooks/use-dataview-source";
  import Accordion from "./accordion.svelte";

  import ControlButton from "./control-button.svelte";
  import ErrorReport from "./error-report.svelte";
  import Dropdown from "./obsidian/dropdown.svelte";
  import SettingItem from "./obsidian/setting-item.svelte";
  import Pill from "./pill.svelte";

  const {
    obsidianFacade,
    initWeeklyView,
    refreshTasks,
    dataviewLoaded,
    showReleaseNotes,
    reSync,
    isOnline,
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
  let filterVisible = false;
  let editControlsVisible = false;

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }

  function toggleFilter() {
    filterVisible = !filterVisible;
  }

  function toggleEditControls() {
    editControlsVisible = !editControlsVisible;
  }

  async function goBack() {
    const previousDay = $dateRange[0].clone().subtract(1, "day");

    const previousNote = await createDailyNoteIfNeeded(previousDay);
    await obsidianFacade.openFileInEditor(previousNote);

    $dateRange = [previousDay];
  }

  async function goForward() {
    const nextDay = $dateRange[0].clone().add(1, "day");

    const nextNote = await createDailyNoteIfNeeded(nextDay);
    await obsidianFacade.openFileInEditor(nextNote);

    $dateRange = [nextDay];
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
  <div class="days">
    <div class="clickable-icon">2024-04-11</div>
    <div class="clickable-icon">2024-04-12</div>
    <div class="clickable-icon">2024-04-13</div>
  </div>

  <Accordion title="Actions">
    <ButtonWithIcon>
      <FileInput class="svg-icon" />
      Open today's note
    </ButtonWithIcon>
    <ButtonWithIcon>
      <Table2 class="svg-icon" />
      Open week planner
    </ButtonWithIcon>
    <ButtonWithIcon>
      <RefreshCw class="svg-icon" />
      Refresh events
    </ButtonWithIcon>
  </Accordion>

  <Accordion title="Drag-and-drop controls">
    Drag mode:
    <div class="button-box">
      <ControlButton
        isActive={$settings.editMode === "simple"}
        label="Other time blocks will not be changed"
        on:click={() => {
          $settings.editMode = "simple";
        }}
      >
        Simple edit
      </ControlButton>
      <ControlButton
        isActive={$settings.editMode === "push"}
        label="Other time blocks are going to shift as you move a block"
        on:click={() => {
          $settings.editMode = "push";
        }}
      >
        Push other blocks
      </ControlButton>
    </div>

    Drag action:
    <div class="button-box">
      <ControlButton
        isActive={$settings.copyOnDrag === false}
        label="Move a task when dragging"
        on:click={() => {
          $settings.copyOnDrag = false;
        }}
      >
        Move on drag
      </ControlButton>
      <ControlButton
        isActive={$settings.copyOnDrag}
        label="Copy a task when dragging"
        on:click={() => {
          $settings.copyOnDrag = true;
        }}
      >
        Copy on drag
      </ControlButton>
    </div>
  </Accordion>

  <Accordion title="Dataview filter" status={`#task and -"archive"`}>
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
          <!--          TODO: move out -->
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
  </Accordion>
</div>

<style>
  .days {
    display: flex;
    justify-content: stretch;
  }

  .days > :global(*) {
    flex: 1 0 0;
  }

  .accordion-contents {
    margin-left: calc(var(--icon-size) + var(--size-4-1));
  }

  :global(.active-filter) {
    color: var(--text-success);
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

  .button-box :global(.clickable-icon.is-active) {
    color: var(--text-on-accent);
    background-color: var(--interactive-accent);
  }

  .button-box :global(.clickable-icon:not(.is-active)) {
    background-color: var(--background-primary);
  }

  .button-box {
    overflow: hidden;
    display: flex;

    font-size: var(--font-ui-small);

    border: 1px solid var(--color-base-40);
    border-radius: var(--clickable-icon-radius);
  }

  .button-box > :global(*) {
    flex: 1 0 0;
    border-radius: 0;
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
    flex-direction: column;
    align-items: stretch;
  }
</style>
