<script lang="ts">
  import type { Moment } from "moment";
  import { writable } from "svelte/store";

  import {
    editCancellation,
    editConfirmation,
  } from "../../global-store/edit-events";
  import { settings } from "../../global-store/settings";
  import { snap } from "../../global-store/settings-utils";
  import type { ObsidianFacade } from "../../service/obsidian-facade";
  import type { OnUpdateFn, PlacedPlanItem } from "../../types";
  import { getId } from "../../util/id";
  import { createPlanItem } from "../hooks/use-edit/transform/create";
  import { EditMode } from "../hooks/use-edit/types";
  import { offsetYToMinutes_NEW, useEdit } from "../hooks/use-edit/use-edit";

  import Task from "./task.svelte";
  // todo: change to parsedTasks for consistency with useEdit()
  export let tasks: PlacedPlanItem[];
  export let day: Moment;
  export let obsidianFacade: ObsidianFacade;
  export let onUpdate: OnUpdateFn;

  let shiftPressed = false;
  let controlPressed = false;
  let el: HTMLDivElement;

  const pointerOffsetY = writable(0);

  $: ({ startEdit, displayedTasks, cancelEdit, isEditInProgress, confirmEdit } =
    useEdit({
      parsedTasks: tasks,
      settings,
      pointerOffsetY: pointerOffsetY,
      onUpdate,
    }));

  $: {
    $editCancellation;

    cancelEdit();
  }
</script>

<svelte:document
  on:mouseup={editCancellation.trigger}
  on:mousemove={(event) => {
    // todo: add debounce after trying to recalculate overlap on every re-render (if it turns out to be slow)

    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;

    pointerOffsetY.set(snap(borderTopToPointerOffsetY, $settings.zoomLevel));
  }}
  on:keydown={(event) => {
    if (event.shiftKey) {
      shiftPressed = true;
    }

    if (event.ctrlKey) {
      controlPressed = true;
    }
  }}
  on:keyup={(event) => {
    if (!event.shiftKey) {
      shiftPressed = false;
    }

    if (!event.ctrlKey) {
      controlPressed = false;
    }
  }}
/>

<div
  bind:this={el}
  class="task-container absolute-stretch-x"
  on:mousedown={async () => {
    const newTask = await createPlanItem(
      day,
      offsetYToMinutes_NEW(
        $pointerOffsetY,
        $settings.zoomLevel,
        $settings.startHour,
      ),
    );

    startEdit({ task: { ...newTask, isGhost: true }, mode: EditMode.CREATE });
  }}
  on:mouseup|stopPropagation={async () => {
    editConfirmation.trigger();

    await confirmEdit();
  }}
>
  {#if $isEditInProgress}
    <div class="banner">Release outside timeline to cancel edit</div>
  {/if}
  {#each $displayedTasks as planItem (planItem.id)}
    <Task
      copyModifierPressed={shiftPressed}
      onCopy={() => {
        // todo: again, a lame way to track which tasks are new
        const copy = {
          ...planItem,
          id: getId(),
          isGhost: true,
          // @ts-expect-error
          location: { ...planItem.location, line: undefined },
        };

        startEdit({
          task: copy,
          mode: EditMode.CREATE,
        });
      }}
      onGripClick={() => {
        let mode = EditMode.DRAG;

        if (controlPressed) {
          mode = EditMode.DRAG_AND_SHIFT_OTHERS;
        }

        startEdit({ task: planItem, mode });
      }}
      onResizeStart={() => {
        const mode = controlPressed
          ? EditMode.RESIZE_AND_SHIFT_OTHERS
          : EditMode.RESIZE;

        startEdit({ task: planItem, mode });
      }}
      {planItem}
      shiftOthersModifierPressed={controlPressed}
      on:mouseup={async () => {
        if ($isEditInProgress) {
          return;
        }

        const { path, line } = planItem.location;
        await obsidianFacade.revealLineInFile(path, line);
      }}
    />
  {/each}
</div>

<style>
  @keyframes pulse {
    from {
      opacity: 0.8;
    }

    to {
      opacity: 0.2;
    }
  }

  .banner {
    position: sticky;
    z-index: 10;
    top: 0;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: var(--size-4-4);

    animation: pulse 1s infinite alternate;
  }

  .task-container {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-right: 10px;
    margin-left: 10px;
  }
</style>
