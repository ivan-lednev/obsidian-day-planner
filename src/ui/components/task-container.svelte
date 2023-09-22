<script lang="ts">
  import { GripVertical } from "lucide-svelte";
  import type { Moment } from "moment";
  import { getContext } from "svelte";
  import { Readable, writable } from "svelte/store";

  import { obsidianContext } from "../../constants";
  import {
    editCancellation,
    editConfirmation,
  } from "../../global-store/edit-events";
  import { settings } from "../../global-store/settings";
  import { snap } from "../../global-store/settings-utils";
  import type { ObsidianContext, PlacedPlanItem } from "../../types";
  import { getId } from "../../util/id";
  import { getEndMinutes } from "../../util/task-utils";
  import { styledCursor } from "../actions/styled-cursor";
  import { createPlanItem } from "../hooks/use-edit/transform/create";
  import { EditMode } from "../hooks/use-edit/types";
  import { offsetYToMinutes_NEW, useEdit } from "../hooks/use-edit/use-edit";
  import { createParsedTasks } from "../stores/parsed-tasks";

  import Task from "./task.svelte";

  export let day: Readable<Moment>;

  const { obsidianFacade, onUpdate } =
    getContext<ObsidianContext>(obsidianContext);

  let shiftPressed = false;
  let controlPressed = false;
  let el: HTMLDivElement;
  let bodyCursor: string | undefined = undefined;
  let gripCursor = "grab";

  const pointerOffsetY = writable(0);

  const parsedTasks = createParsedTasks({ day, obsidianFacade });

  $: ({ startEdit, displayedTasks, cancelEdit, editStatus, confirmEdit } =
    useEdit({
      parsedTasks: $parsedTasks,
      settings,
      pointerOffsetY: pointerOffsetY,
      onUpdate,
    }));

  // todo: clean this up once we add more modes
  $: if (
    $editStatus === EditMode.CREATE ||
    $editStatus === EditMode.DRAG ||
    $editStatus === EditMode.DRAG_AND_SHIFT_OTHERS
  ) {
    bodyCursor = "grabbing";
    gripCursor = "grabbing";
  } else if (
    $editStatus === EditMode.RESIZE ||
    $editStatus === EditMode.RESIZE_AND_SHIFT_OTHERS
  ) {
    bodyCursor = "row-resize";
  } else {
    bodyCursor = undefined;
    gripCursor = "grab";
  }

  $: {
    $editCancellation;

    cancelEdit();
  }

  function getKey(task: PlacedPlanItem) {
    return `${task.startMinutes} ${getEndMinutes(task)} ${task.text} ${
      task.isGhost ?? ""
    }`;
  }
</script>

<svelte:body use:styledCursor={bodyCursor} />

<svelte:document
  on:mouseup={editCancellation.trigger}
  on:mousemove={(event) => {
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
      $day,
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
  {#if $editStatus && $settings.showHelp}
    <div class="banner">Release outside this column to cancel edit</div>
  {/if}
  {#each $displayedTasks as planItem (getKey(planItem))}
    <Task
      onResizeStart={() => {
        const mode = controlPressed
          ? EditMode.RESIZE_AND_SHIFT_OTHERS
          : EditMode.RESIZE;

        startEdit({ task: planItem, mode });
      }}
      {planItem}
      on:mouseup={async () => {
        if ($editStatus) {
          return;
        }

        const { path, line } = planItem.location;
        await obsidianFacade.revealLineInFile(path, line);
      }}
    >
      {#if !planItem.isGhost}
        <div
          style:cursor={gripCursor}
          class="grip"
          on:mousedown|stopPropagation={() => {
            // todo: this can be moved to hook
            let mode = EditMode.DRAG;
            let task = planItem;

            if (controlPressed) {
              mode = EditMode.DRAG_AND_SHIFT_OTHERS;
            } else if (shiftPressed) {
              mode = EditMode.CREATE;

              // todo: again, a lame way to track which tasks are new
              task = {
                ...planItem,
                id: getId(),
                isGhost: true,
                location: { ...planItem.location, line: undefined },
              };
            }

            startEdit({ task, mode });
          }}
        >
          <GripVertical class="svg-icon" />
        </div>
      {/if}
    </Task>
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

  .grip {
    position: relative;
    right: -4px;

    grid-column: 2;
    align-self: flex-start;

    color: var(--text-faint);
  }

  .grip:hover {
    color: var(--text-muted);
  }
</style>
