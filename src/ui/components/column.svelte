<script lang="ts">
  import { getHourSize } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";

  export let visibleHours: number[];
</script>

<div class="column">
  <slot />
  {#each visibleHours as hour}
    <div style:height="{getHourSize($settings)}px" class="hour-block">
      <div
        style:height="{getHourSize($settings) / 2}px"
        class="half-hour-separator"
      ></div>
    </div>
  {/each}
</div>

<style>
  .column {
    position: relative;
    flex: 1 0 0;
  }

  .hour-block {
    flex: 1 0 0;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .half-hour-separator {
    border-bottom: 1px dashed var(--background-modifier-border);
  }
</style>
