<script lang="ts">
  import { hourSize } from "../../timeline-store";

  export let visibleHours;
</script>

<div class="hours-container">
  {#each visibleHours as hour}
    <div class="hour" style:height="{$hourSize}px">
      <div class="hour-number-container" style:transform="translateY(-10px)">
        {hour}
      </div>
      <div class="hour-guide"></div>
    </div>
  {/each}
</div>

<style>
  .hours-container {
    flex: 0 0 40px;
    display: flex;
    flex-direction: column;
  }

  .hour {
    display: flex;
    flex-grow: 1;
    flex-shrink: 0;
  }

  .hour-guide {
    flex: 0 0 10px;
  }

  .hour:not(:first-child) .hour-guide {
    border-top: 1px solid var(--background-modifier-border);
  }

  .hour-number-container {
    /*align-self: flex-start;*/
    position: sticky;
    top: 10px;
    color: var(--text-faint);
    align-self: flex-start;
    display: flex;
    justify-content: center;
    flex: 0 0 30px;
  }
</style>
