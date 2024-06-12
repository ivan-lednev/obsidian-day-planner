<script lang="ts">
  import { GripVertical } from "lucide-svelte";
  import { Moment } from "moment";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import type { ObsidianContext } from "../../types";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";
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
  <div class="unscheduled-task-container">
    {#each $displayedTasks.noTime as task}
      <UnscheduledTimeBlock {task} on:mouseup={() => handleTaskMouseUp(task)}>
        <ExpandingControls --right="4px" --top="4px">
          <BlockControlButton
            slot="visible"
            cursor="grab"
            label="Start moving"
            on:mousedown={() => handleUnscheduledTaskGripMouseDown(task)}
          >
            <GripVertical class="svg-icon" />
          </BlockControlButton>
        </ExpandingControls>
      </UnscheduledTimeBlock>
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
