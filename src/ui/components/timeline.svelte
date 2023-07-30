<script lang="ts">
  import TimeScale from "./time-scale.svelte";
  import Needle from "./needle.svelte";
  import TaskContainer from "./task-container.svelte";
  import { hourSize, startHour } from "../../timeline-store";

  $: visibleHours = Array.from({ length: 24 })
    .map((value, index) => index)
    .slice($startHour);

  let someSetting = false;
</script>

<div class="controls">
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

<style>
  .setting-item-name {
    font-size: var(--font-ui-small);
  }

  .controls {
    margin: var(--size-4-2);
  }

  .time-grid {
    display: flex;
  }

  .task-grid {
    position: relative;
    flex: 1 0 0;
  }

  .time-grid-block {
    border-top: 1px solid var(--background-modifier-border);
    border-left: 1px solid var(--background-modifier-border);
    flex-grow: 1;
  }
</style>
