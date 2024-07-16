<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { Moment } from "moment";
  import { OverlayScrollbarsComponent } from "overlayscrollbars-svelte";
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
  <OverlayScrollbarsComponent
    class="unscheduled-task-container overlayscrollbars-svelte"
    defer
    options={{ scrollbars: { theme: "os-theme-custom" } }}
  >
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
        on:pointerup={() => handleTaskMouseUp(task)}
      />
    {/each}
  </OverlayScrollbarsComponent>
{/if}

<style>
  :global(.unscheduled-task-container) {
    padding: var(--size-2-1) var(--size-4-1);
  }
</style>
