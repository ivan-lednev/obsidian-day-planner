<script lang="ts">
  import { settings } from "../../global-store/settings";
  import { getHourSize } from "../../global-store/derived-settings";

  export let visibleHours: number[];
</script>

<div class="task-grid">
  <slot />
  {#each visibleHours as hour}
    <div style:height="{getHourSize($settings)}px" class="time-grid-block">
      <div
        style:height="{getHourSize($settings) / 2}px"
        class="half-hour-separator"
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
    flex: 1 0 0;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .half-hour-separator {
    border-bottom: 1px dashed var(--background-modifier-border);
  }
</style>
