<script lang="ts">
  import { hourSize } from "../../store/timeline-store";

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
    display: flex;
    flex: 0 0 40px;
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
    position: sticky;
    top: 10px;

    display: flex;
    flex: 0 0 30px;
    align-self: flex-start;
    justify-content: center;

    color: var(--text-faint);
  }
</style>
