<script lang="ts">
  import { hourSize } from "../../global-store/settings-utils";

  export let visibleHours: number[];
</script>

<div class="hours-container">
  {#each visibleHours as hour}
    <div style:height="{$hourSize}px" class="hour">
      <div class="hour-number-container">
        {hour}
      </div>
    </div>
  {/each}
</div>

<style>
  .hours-container {
    position: sticky;
    z-index: 5;
    left: 0;

    display: flex;
    flex: 0 0 30px;
    flex-direction: column;

    background-color: var(--background-primary);
    border-right: 1px solid var(--background-modifier-border);
  }

  .hour {
    display: flex;
    flex: 1 0 0;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .hour-number-container {
    display: flex;
    flex: 0 0 30px;
    align-self: flex-start;
    justify-content: center;

    font-size: var(--nav-item-size);
    color: var(--text-muted);
  }
</style>
