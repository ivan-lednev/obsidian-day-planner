<script lang="ts">
  import RenderedMarkdown from "./rendered-markdown.svelte";

  import { fade } from "svelte/transition";
  import {
    durationToCoords,
    getMinutesFromYCoords,
    getYCoords,
    resizeStatus,
    roundToSnapStep,
    updateTimestamps,
    zoomLevel,
  } from "../../store/timeline-store";

  export let text: string;
  export let startMinutes: number | undefined = undefined;
  export let durationMinutes: number;
  export let pointerYOffset: number;
  export let isGhost = false;

  $: console.log("start minutes changed: ", startMinutes);

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

  $: taskOffset = dragging
    ? $roundToSnapStep(pointerYOffset - pointerYOffsetToTaskStart)
    : initialTaskOffset;

  $: transform = `translateY(${taskOffset}px)`;
  $: cursor = dragging ? "grabbing" : "grab";

  function handleMoveStart(event: MouseEvent) {
    event.stopPropagation();
    pointerYOffsetToTaskStart = event.offsetY;
    dragging = true;
  }

  async function handleMoveConfirm(event: MouseEvent) {
    if (!dragging) {
      return;
    }

    event.stopPropagation();

    const newStartMinutes = $getMinutesFromYCoords(
      pointerYOffset - event.offsetY,
    );

    updateTimestamps(text, {
      startMinutes: newStartMinutes,
      durationMinutes,
    });

    dragging = false;
  }

  function handleResizeConfirm() {
    if (!resizing) {
      return;
    }

    const newDurationMinutes = $durationToCoords(taskHeight);

    resizing = false;

    updateTimestamps(text, {
      startMinutes,
      durationMinutes: newDurationMinutes,
    });
  }

  $: if ($resizeStatus === "confirmed") {
    handleResizeConfirm();
    $resizeStatus = "idle";
  }

  function handleCancel() {
    dragging = false;
    resizing = false;
    $resizeStatus = "cancelled";
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
  on:mousedown={handleMoveStart}
  on:mouseup={handleMoveConfirm}
  transition:fade={{ duration: 100 }}
>
  <RenderedMarkdown {text} />
  <div
    class="resize-handle absolute-stretch-x"
    on:mousedown={handleResizeStart}
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
