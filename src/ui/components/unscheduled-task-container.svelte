<div
  class="unscheduled-task-container"
>
  <div class="tasks">
    <slot />
  </div>
</div>

<style>
  .unscheduled-task-container {
    overflow: auto;
    display: flex;
    gap: var(--size-4-1);

    max-height: 25%;
    padding: var(--size-4-1);

    border-bottom: 1px solid var(--background-modifier-border);
  }

  .tasks {
    flex: 1 0 0;
  }
</style>
