<script lang="ts">
  import type { Moment } from "moment";
  import { MarkdownView } from "obsidian";
  import type { Writable } from "svelte/store";
  import { writable } from "svelte/store";

  import { appStore } from "../../store/app-store";
  import { editCancellation, editConfirmation } from "../../store/edit-events";
  import { updateTimestamps } from "../../store/update-timestamp";
  import type { PlacedPlanItem, PlanItem } from "../../types";
  import { getHorizontalPlacing } from "../../util/horizontal-placing";
  import { getFileByPath, openFileInEditor } from "../../util/obsidian";
  import { useCreate } from "../hooks/use-create";

  import Task from "./task.svelte";

  export let tasks: Writable<PlacedPlanItem[]>;
  export let day: Moment;

  const defaultDurationForNewTask = 30;

  const { creating, startCreation, confirmCreation } = useCreate();

  let pointerYOffset = writable(0);
  let el: HTMLDivElement;

  function handleMousemove(event: MouseEvent) {
    $pointerYOffset = event.clientY - el.getBoundingClientRect().top;
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

  function getDefaultPlacedPlanItem() {
    // todo: no `as`
    return {
      durationMinutes: defaultDurationForNewTask,
      startMinutes: 0,
      endMinutes: defaultDurationForNewTask,
      startTime: window.moment(),
      endTime: window.moment(),
      text: "New item",
      id: "",
      placing: { ...getHorizontalPlacing() },
    } as PlacedPlanItem;
  }

  // todo: out of place
  // todo: remove shim
  async function handleUpdate(updated: PlanItem) {
    await updateTimestamps(tasks, updated.id, {
      startMinutes: updated.startMinutes,
      durationMinutes: updated.endMinutes - updated.startMinutes,
    });
  }

  // todo: out of place
  async function handleTaskMouseUp(planItem: PlanItem) {
    const file = getFileByPath(planItem.location.path);

    const editor = await openFileInEditor(file);
    $appStore.workspace
      .getActiveViewOfType(MarkdownView)
      ?.setEphemeralState({ line: planItem.location.line });

    editor.setCursor({ line: planItem.location.line, ch: 0 });
  }

  async function asyncNoOp() {}
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
      onMouseUp={handleTaskMouseUp}
      onUpdate={handleUpdate}
      {planItem}
      {pointerYOffset}
    />
  {/each}
  {#if $creating}
    <Task
      isGhost
      onMouseUp={asyncNoOp}
      onUpdate={asyncNoOp}
      planItem={getDefaultPlacedPlanItem()}
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
    margin-left: 10px;
  }
</style>
