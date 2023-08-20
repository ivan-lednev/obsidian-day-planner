<script lang="ts">
  import { writable } from "svelte/store";
  import Task from "./task.svelte";
  import { tasks } from "../../store/timeline-store";
  import { useCreate } from "../hooks/use-create";

  const cancelMessage = "Release outside timeline to cancel";
  const defaultDurationForNewTask = 30;

  const { creating, startCreation, cancelCreation, confirmCreation } =
    useCreate();

  const pointerYOffset = writable<number>();
  let el: HTMLDivElement;

  function handleMousemove(event: MouseEvent) {
    pointerYOffset.set(event.clientY - el.getBoundingClientRect().top);
  }
</script>

<!-- TODO: use store to broadcast this -->
<svelte:document on:mouseup={cancelCreation} />

<div
  bind:this={el}
  class="task-container absolute-stretch-x"
  on:mousemove={handleMousemove}
  on:mousedown={startCreation}
  on:mouseup={() => confirmCreation($pointerYOffset)}
>
  {#each $tasks as taskProps (`${taskProps.startTime} ${taskProps.text}`)}
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
