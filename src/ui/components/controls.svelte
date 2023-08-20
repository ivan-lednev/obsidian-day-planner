<script lang="ts">
  import ControlButton from "./control-button.svelte";
  import SettingsIcon from "./icons/settings.svelte";
  import ArrowLeftIcon from "./icons/arrow-left.svelte";
  import ArrowRightIcon from "./icons/arrow-right.svelte";
  import { settings } from "src/store/settings";
  import { openFileInEditor } from "../../util/obsidian";
  import { getAllDailyNotes } from "obsidian-daily-notes-interface";
  import { Notice } from "obsidian";
  import { activeDay, getTimelineFile } from "../../store/timeline-store";

  let settingsVisible = false;

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }

  async function goBack() {
    const sortedNoteKeys = Object.keys(getAllDailyNotes()).sort();
    const currentNoteIndex = sortedNoteKeys.findIndex(
      (key) => key === $activeDay,
    );

    const previousNoteKey = sortedNoteKeys[currentNoteIndex - 1];
    const previousNote = getAllDailyNotes()[previousNoteKey];

    if (!previousNote) {
      new Notice("No more daily notes");
      return;
    }

    await openFileInEditor(previousNote);

    $activeDay = previousNoteKey;
  }

  async function goForward() {
    const sortedNoteKeys = Object.keys(getAllDailyNotes()).sort();
    const currentNoteIndex = sortedNoteKeys.findIndex(
      (key) => key === $activeDay,
    );

    const nextNoteKey = sortedNoteKeys[currentNoteIndex + 1];
    const nextNote = getAllDailyNotes()[nextNoteKey];

    if (!nextNote) {
      new Notice("No more daily notes");
      return;
    }

    await openFileInEditor(nextNote);

    $activeDay = nextNoteKey;
  }
</script>

<!-- todo: this is big enough to deserve its own component -->
<div class="controls">
  <div class="header">
    <ControlButton
      --grid-column-start="2"
      label="Go to previous daily plan"
      on:click={goBack}
    >
      <ArrowLeftIcon />
    </ControlButton>

    <ControlButton
      label="Go to file"
      on:click={() => {
        openFileInEditor(getTimelineFile());
      }}
    >
      <span class="date">{getAllDailyNotes()[$activeDay].basename}</span>
    </ControlButton>

    <ControlButton label="Go to next daily plan" on:click={goForward}>
      <ArrowRightIcon />
    </ControlButton>

    <ControlButton
      --justify-self="flex-end"
      isActive={settingsVisible}
      label="Settings"
      on:click={toggleSettings}
    >
      <SettingsIcon />
    </ControlButton>
  </div>
  {#if settingsVisible}
    <div class="settings">
      <div class="setting-item">
        <div class="setting-item-info">
          <div class="setting-item-name">Zoom</div>
        </div>
        <div class="setting-item-control">
          <select class="dropdown" bind:value={$settings.zoomLevel}>
            {#each ["1", "2", "3", "4"] as level}
              <option value={level}>{level}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="setting-item mod-toggle">
        <div class="setting-item-info">
          <div class="setting-item-name">Auto-scroll to now</div>
        </div>
        <div class="setting-item-control">
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="checkbox-container mod-small"
            class:is-enabled={$settings.centerNeedle}
            on:click={() => {
              $settings.centerNeedle = !$settings.centerNeedle;
            }}
          >
            <input tabindex="0" type="checkbox" />
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
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

  .setting-item {
    padding: var(--size-2-3) 0;
    border: none;
  }

  .setting-item-name {
    font-size: var(--font-ui-small);
  }

  .controls {
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .header {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(5, 1fr);
    justify-content: center;
    margin: var(--size-4-2);
  }
</style>
