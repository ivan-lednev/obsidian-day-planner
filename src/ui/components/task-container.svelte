<script lang="ts">
  import type { Moment } from "moment";
  import type { Writable } from "svelte/store";
  import { writable } from "svelte/store";

  import {
    editCancellation,
    editConfirmation,
  } from "../../global-stores/edit-events";
  import { updateTimestamps } from "../../global-stores/update-timestamp";
  import type { PlacedPlanItem, PlanItem } from "../../types";
  import { revealLineInFile } from "../../util/obsidian";
  import { useCreate } from "../hooks/use-create";
  import { watch } from "../hooks/watch";

  import Task from "./task.svelte";

  export let tasks: Writable<PlacedPlanItem[]>;
  export let day: Moment;

  const { creating, startCreation, confirmCreation, cancelCreation } =
    useCreate();

  let pointerYOffset = writable(0);
  let el: HTMLDivElement;

  function handleMousemove(event: MouseEvent) {
    $pointerYOffset = event.clientY - el.getBoundingClientRect().top;
  }

  function handleMouseUp() {
    if ($creating) {
      confirmCreation(tasks, day, $pointerYOffset);
      return;
    }

    editConfirmation.trigger();
  }

  // todo: out of place. These two should be passed from obsidian views downwards

  function getPlanItemKey(planItem: PlanItem) {
    return `${planItem.startTime} ${planItem.text}`;
  }

  // todo: remove shim
  async function handleUpdate(updated: PlanItem) {
    await updateTimestamps(tasks, updated.id, {
      startMinutes: updated.startMinutes,
      durationMinutes: updated.endMinutes - updated.startMinutes,
    });
  }

  async function handleTaskMouseUp({ location: { path, line } }: PlanItem) {
    await revealLineInFile(path, line);
  }

  watch(editCancellation, () => {
    cancelCreation(tasks);
  });
</script>

<svelte:document on:mouseup={editCancellation.trigger} />

<div
  bind:this={el}
  class="task-container absolute-stretch-x"
  on:mousemove={handleMousemove}
  on:mousedown={() => startCreation(tasks)}
  on:mouseup|stopPropagation={handleMouseUp}
>
  {#each $tasks as planItem (getPlanItemKey(planItem))}
    <Task
      onMouseUp={handleTaskMouseUp}
      onUpdate={handleUpdate}
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
