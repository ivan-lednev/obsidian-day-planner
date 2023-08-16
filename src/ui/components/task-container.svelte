<script lang="ts">
  import { writable } from "svelte/store";
  import Task from "./task.svelte";
  import {
    getTimeFromYOffset,
    roundToSnapStep,
    tasks,
  } from "../../store/timeline-store";
  import { DEFAULT_DURATION_MINUTES } from "src/constants";
  import { createPlanItemFromTimeline } from "src/parser/parser";
  import { insertPlanItem } from "src/update-plan";
  import { getDailyNoteForToday } from "src/util/daily-notes";

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

  async function handleMouseUp() {
    if (!creating) {
      return;
    }

    creating = false;

    const newPlanItem = createPlanItemFromTimeline($pointerYOffset);
    $tasks = [...$tasks, newPlanItem];
    await insertPlanItem(getDailyNoteForToday().path, newPlanItem);
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
  {#each $tasks as taskProps (taskProps.text)}
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
