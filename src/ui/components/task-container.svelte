<script lang="ts">
  import type { Moment } from "moment";
  import { setContext } from "svelte";
  import { Writable, writable } from "svelte/store";

  import { TASKS_FOR_DAY } from "../../constants";
  import { computeOverlap } from "../../parser/overlap";
  import { editCancellation, editConfirmation } from "../../store/edit";
  import { getHorizontalPlacing } from "../../store/horizontal-placing";
  import type { PlanItem } from "../../types";
  import { useCreate } from "../hooks/use-create";

  import Task from "./task.svelte";

  export let tasks: Writable<PlanItem[]>;
  export let day: Moment;

  const cancelMessage = "Release outside timeline to cancel";
  const defaultDurationForNewTask = 30;

  const { creating, startCreation, confirmCreation } = useCreate();

  // this is a hack for the case when plan items get refreshed, and we need to
  // add them to the context instead of the initial value
  function getTasks() {
    return tasks;
  }

  $: overlapLookup = computeOverlap($tasks);

  setContext(TASKS_FOR_DAY, { getTasks });

  const pointerYOffset = writable<number>();
  let el: HTMLDivElement;

  function handleMousemove(event: MouseEvent) {
    pointerYOffset.set(event.clientY - el.getBoundingClientRect().top);
  }

  function handleMouseUp() {
    if ($creating) {
      // todo: to make this uniform, we may pull tasks from context
      confirmCreation(tasks, day, $pointerYOffset);
    }

    editConfirmation.trigger();
  }

  function getPlanItemKey(planItem: PlanItem) {
    return `${planItem.startTime} ${planItem.text}`;
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
  {#each $tasks as planItem (getPlanItemKey(planItem))}
    <Task
      {planItem}
      {pointerYOffset}
      {...getHorizontalPlacing(overlapLookup.get(planItem.id))}
    />
  {/each}
  {#if $creating}
    <Task
      isGhost
      planItem={{ durationMinutes: defaultDurationForNewTask, id: "" }}
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
    margin-left: 10px;
  }
</style>
