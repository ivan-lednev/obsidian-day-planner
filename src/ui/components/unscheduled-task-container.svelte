<script lang="ts">
  import { PanelTopClose, ListTree } from "lucide-svelte";

  import { settings } from "../../global-store/settings";

  import ControlButton from "./control-button.svelte";
</script>

<div
  style:max-height="{$settings.unscheduledTasksHeight}px"
  class="unscheduled-task-container"
>
  <div class="controls">
    <ControlButton
      label="Hide unscheduled tasks"
      on:click={() => {
        $settings.showUncheduledTasks = false;
      }}
    >
      <PanelTopClose class="svg-icon" />
    </ControlButton>
    <ControlButton
      isActive={$settings.showUnscheduledNestedTasks}
      label="Show subtasks without time"
      on:click={() => {
        $settings.showUnscheduledNestedTasks =
          !$settings.showUnscheduledNestedTasks;
      }}
    >
      <ListTree class="svg-icon" />
    </ControlButton>
  </div>
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

  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);
  }
</style>
