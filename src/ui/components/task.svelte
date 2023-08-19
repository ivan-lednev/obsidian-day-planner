<script lang="ts">
  import RenderedMarkdown from "./rendered-markdown.svelte";

  import { SNAP_STEP_MINUTES } from "src/constants";
  import { settings } from "src/store/settings";
  import type { Readable } from "svelte/store";
  import { fade } from "svelte/transition";
  import {
    durationToSize,
    overlapLookup,
    roundToSnapStep,
    timeToTimelineOffset,
  } from "../../store/timeline-store";
  import { useDrag } from "../hooks/use-drag";
  import { useResize } from "../hooks/use-resize";

  export let text: string;
  export let id: string;
  export let startMinutes: number | undefined = undefined;
  export let durationMinutes: number;
  export let pointerYOffset: Readable<number>;
  export let isGhost = false;

  const {
    dragging,
    pointerYOffsetToTaskStart,
    handleMoveStart,
    handleMoveCancel,
    handleMoveConfirm,
  } = useDrag();

  const {
    resizing,
    handleResizeStart,
    handleResizeCancel,
    handleResizeConfirm,
  } = useResize();

  $: initialOffset = isGhost
    ? roundToSnapStep($pointerYOffset)
    : $timeToTimelineOffset(startMinutes);

  $: offset = $dragging
    ? roundToSnapStep($pointerYOffset - $pointerYOffsetToTaskStart)
    : initialOffset;

  $: offsetToPointer = $pointerYOffset - initialOffset;

  $: height = $resizing
    ? roundToSnapStep(offsetToPointer) + SNAP_STEP_MINUTES * $settings.zoomLevel
    : $durationToSize(durationMinutes);

  $: cursor = $dragging ? "grabbing" : "grab";

  $: itemPlacing = $overlapLookup.get(id);
  $: widthPercent = itemPlacing
    ? (itemPlacing.span / itemPlacing.columns) * 100
    : 100;
  $: xOffsetPercent = itemPlacing
    ? (100 / itemPlacing.columns) * itemPlacing.start
    : 0;

  function handleCancel() {
    handleMoveCancel();
    handleResizeCancel();
  }
</script>

<svelte:body on:mouseup={handleCancel} />

<div
  class="gap-box absolute-stretch-x"
  style:height="{height}px"
  style:transform="translateY({offset}px)"
  style:cursor
  style:width="{widthPercent}%"
  style:left="{xOffsetPercent}%"
>
  <div
    class="task"
    class:is-ghost={isGhost}
    on:mousedown|stopPropagation={handleMoveStart}
    on:mouseup={() =>
      handleMoveConfirm(Math.floor(offset), id, durationMinutes)}
  >
    <RenderedMarkdown {text} />
    <div
      class="resize-handle absolute-stretch-x"
      on:mousedown|stopPropagation={handleResizeStart}
      on:mouseup={() => handleResizeConfirm(id, height, startMinutes)}
    ></div>
  </div>
</div>

<style>
  .gap-box {
    display: flex;
    padding-left: 3px;
    padding-right: 3px;

    transition: 0.05s linear;
  }

  .task {
    flex: 1 0 0;

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
