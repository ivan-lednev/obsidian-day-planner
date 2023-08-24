<script lang="ts">
  import { writable } from "svelte/store";

  import { editCancellation, editConfirmation } from "../../store/edit";
  import { PlanItem } from "../../types";
  import { useCreate } from "../hooks/use-create";

  import Task from "./task.svelte";

  export let tasks: PlanItem[]

  const cancelMessage = "Release outside timeline to cancel";
  const defaultDurationForNewTask = 30;

  const { creating, startCreation, confirmCreation } = useCreate();

  const pointerYOffset = writable<number>();
  let el: HTMLDivElement;

  function handleMousemove(event: MouseEvent) {
    pointerYOffset.set(event.clientY - el.getBoundingClientRect().top);
  }

  function handleMouseUp() {
    if ($creating) {
      confirmCreation($pointerYOffset);
    }

    editConfirmation.trigger();
  }
</script>

<svelte:document on:mouseup={editCancellation.trigger} />

<div
  bind:this={el}
  class="task-container absolute-stretch-x"
  on:mousemove={handleMousemove}
  on:mousedown={startCreation}
  on:mouseup|stopPropagation={handleMouseUp}
>
  {#each tasks as taskProps (`${taskProps.startTime} ${taskProps.text}`)}
    <Task {...taskProps} {pointerYOffset} />
  {/each}
  {#if $creating}
    <Task
      id=""
      durationMinutes={defaultDurationForNewTask}
      isGhost
      {pointerYOffset}
      text={cancelMessage}
    />
  {/if}
</div>

<style>
  .task-container {
    top: 0;
    bottom: 0;

    display: flex;
    flex-direction: column;

    margin-right: 10px;
    margin-left: 20px;
  }
</style>
