<script lang="ts">
  import { hourSize } from "./timeline-store";

  export let visibleHours;
</script>

<div class="hours-container">
  {#each visibleHours as hour}
    <div class="hour" style:height="{$hourSize}px">
      <div
        class="hour-number-container"
        style:transform="translateY(calc(-{$hourSize}px / 2))"
      >
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
  }

  .hour-guide {
    flex: 0 0 10px;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .hour-number-container {
    color: var(--text-faint);
    align-self: center;
    display: flex;
    justify-content: center;
    flex: 0 0 30px;
  }
</style>
