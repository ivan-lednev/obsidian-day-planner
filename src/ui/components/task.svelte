<script lang="ts">
  import RenderedMarkdown from "./rendered-markdown.svelte";

  import { SNAP_STEP_MINUTES } from "src/constants";
  import { updateDurationInDailyNote } from "src/update-plan";
  import { fade } from "svelte/transition";
  import {
    durationToCoords,
    getMinutesFromYCoords,
    getYCoords,
    roundToSnapStep,
    tasks,
    zoomLevel,
  } from "../../store/timeline-store";

  export let text: string;
  export let startMinutes: number | undefined = undefined;
  export let durationMinutes: number;
  export let pointerYOffset: number;
  export let isGhost = false;

  let el: HTMLDivElement;
  let dragging = false;
  let resizing = false;
  let pointerYOffsetToTaskStart: number;

  $: initialTaskOffset = startMinutes
    ? $getYCoords(startMinutes)
    : pointerYOffset;

  $: scaledDuration = durationMinutes * Number($zoomLevel);
  $: fromTaskOffsetToPointer = pointerYOffset - initialTaskOffset;

  $: taskHeight = resizing
    ? $roundToSnapStep(fromTaskOffsetToPointer)
    : scaledDuration;

  $: taskOffset = pointerYOffset - pointerYOffsetToTaskStart;
  $: yCoords = dragging ? $roundToSnapStep(taskOffset) : initialTaskOffset;
  $: transform = `translateY(${yCoords}px)`;
  $: cursor = dragging ? "grabbing" : "grab";

  function handleMouseDown(event: MouseEvent) {
    event.stopPropagation();
    pointerYOffsetToTaskStart = event.offsetY;
    dragging = true;
  }

  function handleConfirmEdit(event: MouseEvent) {
    $tasks = $tasks.map((task) => {
      // todo: replace with ID
      if (task.text !== text) {
        return task;
      }

      const newStartMinutes = $getMinutesFromYCoords(
        pointerYOffset - event.offsetY,
      );

      $updateDurationInDailyNote(task, {
        newStartMinutes,
        newDurationMinutes: task.durationMinutes,
      });

      return {
        ...task,
        startMinutes: newStartMinutes,
      };
    });
  }

  function handleConfirmResize(event: MouseEvent) {
    event.stopPropagation();
    resizing = false;

    const newDurationMinutes = $durationToCoords(taskHeight);

    // TODO: duplication
    $tasks = $tasks.map((task) => {
      // todo: replace with ID
      if (task.text !== text) {
        return task;
      }

      $updateDurationInDailyNote(task, {
        newDurationMinutes,
        newStartMinutes: task.startMinutes,
      });

      return {
        ...task,
        durationMinutes: newDurationMinutes,
      };
    });
  }

  function handleCancel() {
    dragging = resizing = false;
  }

  function handleResizeStart(event: MouseEvent) {
    event.stopPropagation();
    resizing = true;
  }
</script>

<svelte:body on:mouseup={handleCancel} />

<div
  bind:this={el}
  class="task absolute-stretch-x"
  class:is-ghost={isGhost}
  style:height="{taskHeight}px"
  style:transform
  style:cursor
  on:mousedown={handleMouseDown}
  on:mouseup={handleConfirmEdit}
  transition:fade={{ duration: 100 }}
>
  <RenderedMarkdown {text} />
  <div
    class="resize-handle absolute-stretch-x"
    on:mousedown={handleResizeStart}
    on:mouseup={handleConfirmResize}
  ></div>
</div>

<style>
  .task {
    overflow: visible;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;

    padding: 5px;

    font-size: var(--font-ui-medium);
    color: var(--text-muted);
    text-align: left;
    white-space: normal;

    background-color: var(--background-primary);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-s);
    box-shadow: none;

    transition-property: height, transform;
    transition: 0.05s linear;
  }

  .is-ghost {
    opacity: 60%;
  }

  .task:hover {
    cursor: grab;
  }

  .resize-handle {
    bottom: -10px;
    height: 20px;
    cursor: s-resize;
  }
</style>
