<script lang="ts">
  import type { Moment } from "moment";
  import { OverlayScrollbarsComponent } from "overlayscrollbars-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { settings } from "../../global-store/settings";
  import { isLocal } from "../../task-types";
  import { createTimeBlockMenu } from "../time-block-menu";

  import DragControls from "./drag-controls.svelte";
  import FloatingControls from "./floating-controls.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import Selectable from "./selectable.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const { day }: { day: Moment } = $props();

  const {
    editContext: { getDisplayedTasksForTimeline, editOperation },
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
        <Selectable
          onSecondarySelect={createTimeBlockMenu}
          selectionBlocked={Boolean($editOperation)}
        >
          {#snippet children(selectable)}
            <FloatingControls active={selectable.state === "primary"}>
              {#snippet anchor(floatingControls)}
                <LocalTimeBlock
                  isActive={selectable.state !== "none"}
                  onpointerup={selectable.onpointerup}
                  {task}
                  use={[...selectable.use, ...floatingControls.actions]}
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
