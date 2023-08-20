<script lang="ts">
  import ControlButton from "./control-button.svelte";
  import SettingsIcon from "./icons/settings.svelte";
  import GoToFileIcon from "./icons/go-to-file.svelte";
  import { onMount } from "svelte";
  import { settings } from "src/store/settings";
  import { openFileInEditor } from "../../util/obsidian";
  import { getDailyNoteForToday } from "../../util/daily-notes";

  let settingsVisible = false;

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }

  function getFormattedDate() {
    return window.moment().format($settings.timelineDateFormat);
  }

  let date = getFormattedDate();

  onMount(() => {
    const interval = setInterval(() => {
      date = getFormattedDate();
    }, 5000);

    return () => clearInterval(interval);
  });
</script>

<div class="controls">
  <div class="header">
    <span class="date">{date}</span>
    <ControlButton
      label="Go to source file"
      on:click={() => {
        openFileInEditor(getDailyNoteForToday());
      }}
    >
      <GoToFileIcon />
    </ControlButton>
    <ControlButton
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
    flex: 1 0 0;
    align-items: center;
    justify-content: flex-start;

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
    display: flex;
    margin: var(--size-4-2);
  }
</style>
