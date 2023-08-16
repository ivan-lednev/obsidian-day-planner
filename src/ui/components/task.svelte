<script lang="ts">
  import RenderedMarkdown from "./rendered-markdown.svelte";

  import { fade } from "svelte/transition";
  import {
    sizeToDuration,
    roundToSnapStep,
    getTimeFromYOffset,
    timeToTimelineOffset,
    durationToSize,
  } from "../../store/timeline-store";
  import { settings } from "src/store/settings";
  import { SNAP_STEP_MINUTES } from "src/constants";
  import { updateTimestamps } from "src/store/update-timestamp";
  import { useDrag } from "./use-drag";
  import type { Readable } from "svelte/store";

  export let text: string;
  export let startMinutes: number | undefined = undefined;
  export let durationMinutes: number;
  export let pointerYOffset: Readable<number>;
  export let isGhost = false;

  const { dragging, pointerYOffsetToTaskStart, handleMoveStart, handleMoveCancel, handleMoveConfirm } =
    useDrag({ text, durationMinutes }, pointerYOffset);


  let resizing = false;

  $: initialTaskOffset = isGhost
    ? $pointerYOffset
    : $timeToTimelineOffset(startMinutes);

  $: taskOffset = $dragging
    ? roundToSnapStep($pointerYOffset - $pointerYOffsetToTaskStart)
    : initialTaskOffset;

  $: fromTaskOffsetToPointer = $pointerYOffset - initialTaskOffset;

  $: taskHeight = resizing
    ? roundToSnapStep(fromTaskOffsetToPointer) +
      SNAP_STEP_MINUTES * $settings.zoomLevel
    : $durationToSize(durationMinutes);

  $: cursor = $dragging ? "grabbing" : "grab";

  async function handleResizeConfirm() {
    resizing = false;

    const newDurationMinutes = sizeToDuration(taskHeight);

    await updateTimestamps(text, {
      startMinutes,
      durationMinutes: newDurationMinutes,
    });
  }

  function handleCancel() {
    handleMoveCancel();
    resizing = false;
  }

  function handleResizeStart() {
    resizing = true;
  }
</script>

<svelte:body on:mouseup={handleCancel} />

<div
  class="task absolute-stretch-x"
  class:is-ghost={isGhost}
  style:height="{taskHeight}px"
  style:transform="translateY({taskOffset}px)"
  style:cursor
  on:mousedown|stopPropagation={handleMoveStart}
  on:mouseup={handleMoveConfirm}
  transition:fade={{ duration: 100 }}
>
  <RenderedMarkdown {text} />
  <div
    class="resize-handle absolute-stretch-x"
    on:mousedown|stopPropagation={handleResizeStart}
    on:mouseup|stopPropagation={handleResizeConfirm}
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
    bottom: -15px;
    height: 30px;
    cursor: s-resize;
  }
</style>
