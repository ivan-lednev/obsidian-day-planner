<script lang="ts">
  import RenderedMarkdown from "./rendered-markdown.svelte";

  import { SNAP_STEP_MINUTES } from "src/constants";
  import { updateDurationInDailyNote } from "src/update-plan";
  import { fade } from "svelte/transition";
  import {
    getMinutesFromYCoords,
    getYCoords,
    tasks,
    zoomLevel,
  } from "../../store/timeline-store";

  export let text: string;
  export let startMinutes: number | undefined = undefined;
  export let durationMinutes: number;
  export let pointerYCoords: number;
  export let isGhost = false;

  let el: HTMLDivElement;
  let dragging = false;
  let resizing = false;
  let pointerYWithinTask: number;

  $: defaultYCoords = startMinutes ? $getYCoords(startMinutes) : pointerYCoords;

  $: height = `${
    resizing
      ? pointerYCoords - defaultYCoords
      : durationMinutes * Number($zoomLevel)
  }px`;

  $: snapStep = Number($zoomLevel) * SNAP_STEP_MINUTES;

  $: taskStartYCoords = pointerYCoords - pointerYWithinTask;
  $: yCoords = dragging
    ? taskStartYCoords - (taskStartYCoords % snapStep)
    : defaultYCoords;
  $: transform = `translateY(${yCoords}px)`;
  $: cursor = dragging ? "grabbing" : "grab";

  function handleMouseDown(event: MouseEvent) {
    event.stopPropagation();
    pointerYWithinTask = event.offsetY;
    dragging = true;
  }

  function handleConfirmEdit(event: MouseEvent) {
    $tasks = $tasks.map((task) => {
      // todo: replace with ID
      if (task.text !== text) {
        return task;
      }

      const newStartMinutes = $getMinutesFromYCoords(
        pointerYCoords - event.offsetY,
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

    // todo: duplication
    $tasks = $tasks.map((task) => {
      // todo: replace with ID
      if (task.text !== text) {
        return task;
      }

      const newDurationMinutes =
        (pointerYCoords - defaultYCoords) / Number($zoomLevel);

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
  style:height
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

    transition: transform 0.05s linear;
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
