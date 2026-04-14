<script lang="ts">
  import ControlButton from "./control-button.svelte";
</script>

<div class="day-of-week-picker">
  {#each ["M", "T", "W", "T", "F", "S", "S"] as dayOfWeek, index}
    <div class="column">
      {dayOfWeek}
      <ControlButton
        isActive={dayOfWeek === "W"}
        label="foo"
        onclick={() => {}}
      >
        <span class={["day-of-week", dayOfWeek === "W" && "active"]}>
          {index + 1}
        </span>
      </ControlButton>
    </div>
  {/each}
</div>

<style>
  .day-of-week-picker {
    display: flex;
    gap: var(--size-2-1);
    justify-content: space-between;
    padding-right: var(--size-4-3);
  }

  .day-of-week-picker :global(*) {
    flex: 1;
  }

  .day-of-week {
    display: inline-flex;
    justify-content: center;
    font-weight: var(--font-semibold);
    color: var(--text-muted);
  }

  .active {
    color: var(--color-accent);
  }

  .column {
    display: flex;
    flex-direction: column;
    gap: var(--size-2-1);
    align-items: center;
  }
</style>
