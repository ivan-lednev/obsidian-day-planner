<script lang="ts">
  import RenderedMarkdown from "./rendered-markdown.svelte";

  import { SNAP_STEP_MINUTES } from "src/constants";
  import { settings } from "src/store/settings";
  import type { Readable } from "svelte/store";
  import {
    durationToSize,
    overlapLookup,
    roundToSnapStep,
    timeToTimelineOffset,
  } from "../../store/timeline-store";
  import { useDrag } from "../hooks/use-drag";
  import { useResize } from "../hooks/use-resize";
  import { getRelationToNow } from "../../util/moment";
  import { time } from "../../store/time";
  import type { Moment } from "moment";

  export let text: string;
  export let id: string;
  export let startTime: Moment;
  export let endTime: Moment;
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

  $: relationToNow = isGhost
    ? "future"
    : getRelationToNow($time, startTime, endTime);

  function handleCancel() {
    handleMoveCancel();
    handleResizeCancel();
  }
</script>

<svelte:body on:mouseup={handleCancel} />

<div
  style:height="{height}px"
  style:transform="translateY({offset}px)"
  style:cursor
  style:width="{widthPercent}%"
  style:left="{xOffsetPercent}%"
  class="gap-box absolute-stretch-x"
>
  <div
    class="task {relationToNow}"
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
    padding-right: 3px;
    padding-left: 3px;
    transition: 0.05s linear;
  }

  .task {
    overflow: visible;
    display: flex;
    flex: 1 0 0;
    align-items: flex-start;
    justify-content: flex-start;

    padding: 5px;

    font-size: var(--font-ui-medium);
    color: var(--text-muted);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    background-color: var(--background-primary);
    border: 1px solid var(--text-faint);
    border-radius: var(--radius-s);
  }

  .past {
    background-color: var(--background-secondary);
  }

  .present {
    border-color: var(--color-accent);
  }

  .is-ghost {
    opacity: 0.6;
  }

  .task:hover {
    cursor: grab;
  }

  .resize-handle {
    cursor: s-resize;
    bottom: -15px;
    height: 30px;
  }
</style>
