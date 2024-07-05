<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { Moment } from "moment";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import type { ObsidianContext } from "../../types";
  import { floatingUi } from "../actions/floating-ui";

  import DragControls from "./drag-controls.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";


  export let day: Moment;

  const {
    editContext: { getEditHandlers, editOperation },
  } = getContext<ObsidianContext>(obsidianContext);

  $: ({
    displayedTasks,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  } = getEditHandlers(day));
</script>

{#if $displayedTasks.noTime.length > 0 && $settings.showUncheduledTasks}
  <div class="unscheduled-task-container">
    {#each $displayedTasks.noTime as task}
      <UnscheduledTimeBlock
        {task}
        use={[
          [
            floatingUi,
            {
              when: !$editOperation,
              Component: DragControls,
              props: {
                onMove: () => handleUnscheduledTaskGripMouseDown(task),
              },
              options: {
                middleware: [offset({ mainAxis: -32, crossAxis: -4 })],
                placement: "top-end",
              },
            },
          ],
        ]}
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
    padding: var(--size-2-1) var(--size-4-1);
  }
</style>
