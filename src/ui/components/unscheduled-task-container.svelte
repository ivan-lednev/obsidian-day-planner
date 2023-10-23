<script lang="ts">
  import { defaultDurationMinutes } from "../../constants";
  import { settings } from "../../global-store/settings";
</script>

<div
  style:max-height="{$settings.zoomLevel * defaultDurationMinutes * 2}px"
  class="unscheduled-task-container"
>
  <slot />
</div>

<style>
  .unscheduled-task-container {
    padding: 1px 10px 0 10px;
    border-bottom: 1px solid var(--background-modifier-border);
    overflow: auto;
  }
</style>
