<script lang="ts">

  import { settings } from "../../global-store/settings";

</script>

<div
  style:max-height="{$settings.unscheduledTasksHeight}px"
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

    padding: var(--size-4-1);

    border-bottom: 1px solid var(--background-modifier-border);
  }

  .tasks {
    flex: 1 0 0;
  }
</style>
