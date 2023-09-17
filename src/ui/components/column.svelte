<script lang="ts">
  import { hourSize } from "../../global-store/settings-utils";

  export let visibleHours: number[];
</script>

<div class="task-grid">
  <slot />
  {#each visibleHours as hour}
    <div style:height="{$hourSize}px" class="time-grid-block">
      <div style:height="{$hourSize / 2}px" class="half-hour-separator"></div>
    </div>
  {/each}
</div>

<style>
  .task-grid {
    position: relative;
    flex: 1 0 0;
  }

  .time-grid-block {
    flex: 1 0 0;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .half-hour-separator {
    border-bottom: 1px dashed var(--background-modifier-border);
  }
</style>
