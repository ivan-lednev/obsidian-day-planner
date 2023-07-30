<script lang="ts">
  import TimeScale from "./time-scale.svelte";
  import Needle from "./needle.svelte";
  import TaskContainer from "./task-container.svelte";
  import SettingsButton from "./settings-button.svelte";
  import { hourSize, startHour } from "../../timeline-store";

  $: visibleHours = Array.from({ length: 24 })
    .map((value, index) => index)
    .slice($startHour);

  let someSetting = false;
  let settingsVisible = false;

  function toggleSettings() {
    settingsVisible = !settingsVisible;
  }
</script>

<div class="controls">
  <SettingsButton isActive={settingsVisible} onClick={toggleSettings} />
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
        class:is-enabled={someSetting}
        on:click={() => {
          someSetting = !someSetting;
        }}
      >
        <input type="checkbox" tabindex="0" />
      </div>
    </div>
  </div>
</div>
<div class="scroller">
  <div class="time-grid">
    <TimeScale {visibleHours} />
    <div class="task-grid">
      <div class="absolute-stretch-x">
        <Needle />
        <TaskContainer />
      </div>
      {#each visibleHours as hour}
        <div class="time-grid-block" style:height="{$hourSize}px"></div>
      {/each}
    </div>
  </div>
</div>

<style>
  .setting-item {
    padding: var(--size-2-3) 0;
    border: none;
  }

  .setting-item-name {
    font-size: var(--font-ui-small);
  }

  .controls {
    padding: var(--size-4-2);
    padding-bottom: 0;
    display: flex;
    flex-direction: column;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .scroller {
    height: 100%;
    overflow: auto;
  }

  .time-grid {
    display: flex;
  }

  .task-grid {
    position: relative;
    flex: 1 0 0;
  }

  .time-grid-block {
    border-left: 1px solid var(--background-modifier-border);
    flex-grow: 1;
    flex-shrink: 0;
  }

  .time-grid-block:not(:nth-child(2)) {
    /* TODO: lame workaround */
    border-top: 1px solid var(--background-modifier-border);
  }
</style>
