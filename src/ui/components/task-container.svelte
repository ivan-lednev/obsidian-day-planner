<script lang="ts">
  import type { PlanItem } from "src/plan-item";
  import Task from "./task.svelte";
  import { updateTimestamps } from "src/store/update-timestamp";
  import { derived, writable } from "svelte/store";
  import { getTimeFromYOffset } from "src/store/timeline-store";

  export let tasks: PlanItem[] = [];

  const cancelMessage = "Release outside timeline to cancel";
  const defaultDurationForNewTask = 30;

  const pointerYOffset = writable<number>();
  let el: HTMLDivElement;
  let creating = false;

  function handleMousemove(event: MouseEvent) {
    pointerYOffset.set(event.clientY - el.getBoundingClientRect().top);
  }

  function startCreation() {
    creating = true;
  }

  function handleMouseUp(event: MouseEvent) {
    cancelCreation();
  }

  function cancelCreation() {
    creating = false;
  }

</script>

<!-- TODO: use store to broadcast this -->
<svelte:document on:mouseup={cancelCreation} />

<div
  bind:this={el}
  class="task-container absolute-stretch-x"
  on:mousemove={handleMousemove}
  on:mousedown={startCreation}
  on:mouseup={handleMouseUp}
>
  {#each tasks as taskProps (taskProps.text)}
    <Task {...taskProps} {pointerYOffset} />
  {/each}
  {#if creating}
    <Task
      isGhost
      text={cancelMessage}
      durationMinutes={defaultDurationForNewTask}
      {pointerYOffset}
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
