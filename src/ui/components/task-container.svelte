<script lang="ts">
  import type { Moment } from "moment";
  import { writable } from "svelte/store";

  import {
    editCancellation,
    editConfirmation,
  } from "../../global-stores/edit-events";
  import type { PlacedPlanItem } from "../../types";
  import type { ObsidianFacade } from "../../util/obsidian-facade";
  import { useCopy } from "../hooks/use-copy";
  import { useCreate } from "../hooks/use-create";

  import Task from "./task.svelte";

  export let tasks: PlacedPlanItem[];
  export let day: Moment;
  export let obsidianFacade: ObsidianFacade;

  let shiftPressed = false;
  let el: HTMLDivElement;

  const tasksStore = writable(tasks);
  const { startCreation, confirmCreation, cancelCreation } = useCreate();
  const { startCopy, confirmCopy } = useCopy();
  const pointerYOffset = writable(0);

  async function handleMouseUp() {
    await confirmCreation(tasksStore, day, $pointerYOffset);
    await confirmCopy(tasksStore, $pointerYOffset);
    editConfirmation.trigger();
  }

  $: {
    $editCancellation;

    cancelCreation(tasksStore);
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
    const viewportToElOffsetY = el.getBoundingClientRect().top;
    const borderTopToPointerOffsetY = event.clientY - viewportToElOffsetY;

    pointerYOffset.set(borderTopToPointerOffsetY);
  }}
  on:mousedown={() => startCreation(tasksStore)}
  on:mouseup|stopPropagation={handleMouseUp}
>
  {#each $tasksStore as planItem (planItem.id)}
    <Task
      copyModifierPressed={shiftPressed}
      onCopy={() => startCopy(planItem, tasksStore)}
      onMouseUp={async ({ location: { path, line } }) => {
        await obsidianFacade.revealLineInFile(path, line);
      }}
      onUpdate={async (task) => {
        await obsidianFacade.updateTask(tasksStore, task);
      }}
      {planItem}
      {pointerYOffset}
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
