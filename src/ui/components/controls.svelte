<script lang="ts">
  import SettingsButton from "./settings-button.svelte";

  let settingsVisible = false;

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }
</script>

<div class="controls">
  <div class="header">
    <span class="date">Jul 30, 2023, Sunday</span>
    <SettingsButton isActive={settingsVisible} onClick={toggleSettings} />
  </div>
  {#if settingsVisible}
    <div>
      <div class="setting-item">
        <div class="setting-item-info">
          <div class="setting-item-name">Zoom</div>
        </div>
        <div class="setting-item-control">
          <select class="dropdown">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
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
          on:click={() => {
          }}
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
