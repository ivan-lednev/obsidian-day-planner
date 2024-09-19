<script lang="ts">
  import type { Moment } from "moment";
  import { OverlayScrollbarsComponent } from "overlayscrollbars-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import { isLocal } from "../../task-types";
  import { type ObsidianContext } from "../../types";

  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  export let day: Moment;

  const {
    editContext: { getEditHandlers },
  } = getContext<ObsidianContext>(obsidianContext);

  $: ({
    displayedTasks,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  } = getEditHandlers(day));
</script>

{#if $displayedTasks.noTime.length > 0 && $settings.showUncheduledTasks}
  <OverlayScrollbarsComponent
    class="unscheduled-task-container overlayscrollbars-svelte"
    defer
    options={{ scrollbars: { theme: "os-theme-custom" } }}
  >
    {#each $displayedTasks.noTime as task}
      <!--    TODO: handle all day events here-->
      {#if isLocal(task)}
        <UnscheduledTimeBlock
          onGripMouseDown={handleUnscheduledTaskGripMouseDown}
          onMouseUp={() => {
            handleTaskMouseUp(task);
          }}
          {task}
        />
      {/if}
    {/each}
  </OverlayScrollbarsComponent>
{/if}

<style>
  :global(.unscheduled-task-container) {
    padding: var(--size-2-1) var(--size-4-1);
  }
</style>
