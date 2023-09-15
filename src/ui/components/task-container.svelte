<script lang="ts">
  import type { Moment } from "moment";
  import { writable } from "svelte/store";

  import {
    editCancellation,
    editConfirmation,
  } from "../../global-stores/edit-events";
  import { settings } from "../../global-stores/settings";
  import { snap } from "../../global-stores/settings-utils";
  import type { PlacedPlanItem } from "../../types";
  import type { ObsidianFacade } from "../../util/obsidian-facade";
  import { useCopy } from "../hooks/use-copy";
  import { useCreate } from "../hooks/use-create";
  import { useEdit } from "../hooks/use-edit";
  import { EditMode } from "../hooks/use-edit/types";

  import Task from "./task.svelte";

  // todo: change to parsedTasks for consistency with useEdit()
  export let tasks: PlacedPlanItem[];
  export let day: Moment;
  export let obsidianFacade: ObsidianFacade;

  let shiftPressed = false;
  let el: HTMLDivElement;

  // todo: replace with displayedTasks
  const tasksStore = writable(tasks);
  const pointerOffsetY = writable(0);

  const { startCreation, confirmCreation, cancelCreation } = useCreate();
  const { startCopy, confirmCopy } = useCopy();
  $: ({ startEdit, displayedTasks, cancelEdit, confirmEdit } = useEdit({
    parsedTasks: tasks,
    settings,
    pointerOffsetY: pointerOffsetY,
    onUpdate: () => Promise.resolve(),
  }));

  $: {
    $editCancellation;

    cancelCreation(tasksStore);
    cancelEdit();
  }
</script>

<svelte:document
  on:mouseup={editCancellation.trigger}
  on:keydown={(event) => {
    if (event.shiftKey) {
      shiftPressed = true;
    }
  }}
  on:keyup={(event) => {
    if (!event.shiftKey) {
      shiftPressed = false;
    }
  }}
/>

<div
  bind:this={el}
  class="task-container absolute-stretch-x"
  on:mousemove={(event) => {
    // todo: add debounce after trying to recalculate overlap on every re-render (if it turns out to be slow)

    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;

    pointerOffsetY.set(snap(borderTopToPointerOffsetY, $settings.zoomLevel));
  }}
  on:mousedown={() => startCreation(tasksStore)}
  on:mouseup|stopPropagation={async () => {
    editConfirmation.trigger();

    await confirmCreation(tasksStore, day, $pointerOffsetY);
    await confirmCopy(tasksStore, $pointerOffsetY);
    await confirmEdit();
  }}
>
  {#each $displayedTasks as planItem (planItem.id)}
    <Task
      copyModifierPressed={shiftPressed}
      onCopy={() => startCopy(planItem, tasksStore)}
      onGripClick={() => {
        startEdit(planItem, EditMode.DRAG_AND_SHIFT_OTHERS);
      }}
      onMouseUp={async ({ location: { path, line } }) => {
        await obsidianFacade.revealLineInFile(path, line);
      }}
      onUpdate={async (task) => {
        await obsidianFacade.updateTask(tasksStore, task);
      }}
      {planItem}
      {pointerOffsetY}
    />
  {/each}
</div>

<style>
  .task-container {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-right: 10px;
    margin-left: 10px;
  }
</style>
