<script lang="ts">
  import { hourSize } from "../../store/timeline-store";

  export let visibleHours: number[];
</script>
<div class="task-grid">
  <div class="absolute-stretch-x">
    <slot />
  </div>
  {#each visibleHours as hour}
    <div class="time-grid-block" style:height="{$hourSize}px">
      <div
        class="half-hour-separator"
        style:height="{$hourSize / 2}px"
      ></div>
    </div>
  {/each}
</div>

<style>

  .task-grid {
    position: relative;
    flex: 1 0 0;
  }

  .time-grid-block {
    flex-grow: 1;
    flex-shrink: 0;
    border-left: 1px solid var(--background-modifier-border);
  }

  .half-hour-separator {
    border-bottom: 1px dashed var(--background-modifier-border);
  }

  /* TODO: this selector is a lame workaround for task container which is absolutely positioned */
  .time-grid-block:not(:nth-child(2)) {
    border-top: 1px solid var(--background-modifier-border);
  }
</style>
