<script lang="ts">
  import SettingsButton from "./settings-button.svelte";
  import { onMount } from "svelte";
  import { timelineDateFormat, zoomLevel } from "../../timeline-store";

  let settingsVisible = false;

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }

  function getFormattedDate() {
    return moment().format($timelineDateFormat);
  }

  let date = getFormattedDate();

  onMount(() => {
    const interval = setInterval(() => {
      date = getFormattedDate();
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

<div class="controls">
  <div class="header">
    <span class="date">{date}</span>
    <SettingsButton isActive={settingsVisible} onClick={toggleSettings} />
  </div>
  {#if settingsVisible}
    <div>
      <div class="setting-item">
        <div class="setting-item-info">
          <div class="setting-item-name">Zoom</div>
        </div>
        <div class="setting-item-control">
          <select
            bind:value={$zoomLevel}
            class="dropdown"
          >
            {#each ["1", "2", "3", "4"] as level}
              <option value={level}>{level}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <div class="setting-item mod-toggle" style:display="none">
      <div class="setting-item-info">
        <div class="setting-item-name">Collapse results</div>
        <div class="setting-item-description"></div>
      </div>
      <div class="setting-item-control">
        <div
          class="checkbox-container mod-small"
          class:is-enabled={false}
        >
          <input type="checkbox" tabindex="0" />
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .date {
    font-size: 1.2em;
    color: var(--text-muted);
    flex: 1 0 0;
    display: flex;
    justify-content: center;
  }

  .setting-item {
    padding: var(--size-2-3) 0;
    border: none;
  }

  .setting-item-name {
    font-size: var(--font-ui-small);
  }

  .controls {
    padding: var(--size-4-2);
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .header {
    display: flex;
  }
</style>
