<script lang="ts">
  import { settings } from "../../global-store/settings";
</script>

<div
  style:max-height="{$settings.unscheduledTasksHeight}px"
  class="unscheduled-task-container"
>
  <slot />
</div>

<style>
  .unscheduled-task-container {
    overflow: auto;
    padding: var(--size-4-1) var(--size-4-2);
    background: repeating-linear-gradient(
      45deg,
      var(--background-secondary),
      var(--background-secondary) 10px,
      var(--background-modifier-border) 10px,
      var(--background-modifier-border) 20px
    );
    border-bottom: 1px solid var(--background-modifier-border);
  }
</style>
