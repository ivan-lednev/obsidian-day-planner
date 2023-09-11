<script lang="ts">
  import type { Moment } from "moment";
  import { writable } from "svelte/store";

import {
    editCancellation,
    editConfirmation,
  } from "../../global-stores/edit-events";
  import { updateTimestamps } from "../../global-stores/update-timestamp";
  import type { PlacedPlanItem, PlanItem } from "../../types";
  import { revealLineInFile } from "../../util/obsidian";
  import { useCopy } from "../hooks/use-copy";
  import { useCreate } from "../hooks/use-create";
  import { watch } from "../hooks/watch";

  import Task from "./task.svelte";


  export let tasks: PlacedPlanItem[];
  export let day: Moment;

  const tasksStore = writable(tasks);

  const { startCreation, confirmCreation, cancelCreation } = useCreate();

  const { startCopy, confirmCopy } = useCopy();

  let shiftPressed = false;
  let pointerYOffset = writable(0);
  let el: HTMLDivElement;

  function handleMousemove(event: MouseEvent) {
    $pointerYOffset = event.clientY - el.getBoundingClientRect().top;
  }

  async function handleMouseUp() {
    await confirmCreation(tasksStore, day, $pointerYOffset);
    await confirmCopy(tasksStore, $pointerYOffset);
    editConfirmation.trigger();
  }

  // todo: out of place. These two should be passed from obsidian views downwards

  async function updateTask(updated: PlanItem) {
    await updateTimestamps(tasksStore, updated.id, {
      startMinutes: updated.startMinutes,
      durationMinutes: updated.endMinutes - updated.startMinutes,
    });
  }

  async function handleTaskMouseUp({ location: { path, line } }: PlanItem) {
    await revealLineInFile(path, line);
  }

  watch(editCancellation, () => {
    cancelCreation(tasksStore);
  });
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
  on:mousemove={handleMousemove}
  on:mousedown={() => startCreation(tasksStore)}
  on:mouseup|stopPropagation={handleMouseUp}
>
  {#each $tasksStore as planItem (planItem.id)}
    <Task
      copyModifierPressed={shiftPressed}
      onCopy={() => startCopy(planItem, tasksStore)}
      onMouseUp={handleTaskMouseUp}
      onUpdate={updateTask}
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
