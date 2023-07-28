<script lang="ts">
  export let hours;
</script>

<div class="hours-container">
  {#each hours as hour}
    <div class="hour">
      <div class="hour-number-container">
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
    height: 60px;
  }

  .hour-guide {
    flex: 0 0 10px;
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .hour-number-container {
    color: var(--text-faint);
    align-self: center;
    transform: translateY(calc(-60px / 2));
    display: flex;
    justify-content: center;
    flex: 0 0 30px;
  }
</style>
