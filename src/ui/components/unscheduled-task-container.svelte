<script lang="ts">
  import { Moment } from "moment";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import type { ObsidianContext } from "../../types";

  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  export let day: Moment;

  const {
    editContext: { getEditHandlers },
  } = getContext<ObsidianContext>(obsidianContext);

  $: ({
    displayedTasks,
    cursor,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  } = getEditHandlers(day));
</script>

{#if $displayedTasks.noTime.length > 0 && $settings.showUncheduledTasks}
  <div class="unscheduled-task-container">
    {#each $displayedTasks.noTime as task}
      <UnscheduledTimeBlock
        gripCursor={$cursor.gripCursor}
        onGripMouseDown={() => handleUnscheduledTaskGripMouseDown(task)}
        {task}
        on:mouseup={() => handleTaskMouseUp(task)}
      />
    {/each}
  </div>
{/if}

<style>
  .unscheduled-task-container {
    overflow: auto;
    display: flex;
    flex-direction: column;

    max-height: 20vh;
    padding: var(--size-2-1) var(--size-4-1);
  }
</style>
