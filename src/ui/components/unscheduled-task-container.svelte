<script lang="ts">
  import type { Moment } from "moment";
  import { OverlayScrollbarsComponent } from "overlayscrollbars-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { settings } from "../../global-store/settings";
  import { isLocal } from "../../task-types";

  import DragControls from "./drag-controls.svelte";
  import FloatingControls from "./floating-controls.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import Selectable from "./selectable.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const { day }: { day: Moment } = $props();

  const {
    editContext: { getDisplayedTasksForTimeline },
  } = getObsidianContext();

  const displayedTasksForTimeline = $derived(getDisplayedTasksForTimeline(day));
</script>

{#if $displayedTasksForTimeline.noTime.length > 0 && $settings.showUncheduledTasks}
  <OverlayScrollbarsComponent
    class="unscheduled-task-container overlayscrollbars-svelte"
    defer
    options={{ scrollbars: { theme: "os-theme-custom" } }}
  >
    {#each $displayedTasksForTimeline.noTime as task}
      {#if isLocal(task)}
        <Selectable>
          {#snippet children({ use: selectableActions, isSelected })}
            <FloatingControls isAnchorActive={isSelected}>
              {#snippet anchor({ actions: floatingControlsActions })}
                <LocalTimeBlock
                  isActive={isSelected}
                  {task}
                  use={[...selectableActions, ...floatingControlsActions]}
                />
              {/snippet}
              {#snippet topEnd({ isActive, setIsActive })}
                <DragControls
                  --expanding-controls-position="absolute"
                  {isActive}
                  {setIsActive}
                  {task}
                />
              {/snippet}
            </FloatingControls>
          {/snippet}
        </Selectable>
      {:else}
        <TimeBlockBase {task}>
          <RemoteTimeBlockContent {task} />
        </TimeBlockBase>
      {/if}
    {/each}
  </OverlayScrollbarsComponent>
{/if}

<style>
  :global(.unscheduled-task-container) {
    padding: var(--size-2-1) var(--size-4-1);
  }
</style>
