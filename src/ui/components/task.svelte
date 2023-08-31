<script lang="ts">
  import { currentTime } from "../../store/current-time";
  import { editCancellation, editConfirmation } from "../../store/edit-events";
  import {
    durationToSize,
    roundToSnapStep,
    timeToTimelineOffset,
  } from "../../store/timeline-store";
  import type { PlacedPlanItem } from "../../types";
  import { getRelationToNow } from "../../util/moment";
  import { useDrag } from "../hooks/use-drag";
  import { useResize } from "../hooks/use-resize";
  import { watch } from "../hooks/watch";

  import TaskCompletedIcon from "./icons/check-circle.svelte";
  import TaskCircleIcon from "./icons/circle.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";

  export let planItem: PlacedPlanItem;
  export let pointerYOffset: number;
  export let isGhost = false;

  const {
    dragging,
    cursor,
    pointerYOffsetToTaskStart,
    startMove,
    confirmMove,
    cancelMove,
  } = useDrag();

  const { resizing, cancelResize, startResize, confirmResize } = useResize();

  $: initialOffset = isGhost
    ? roundToSnapStep(pointerYOffset)
    : $timeToTimelineOffset(planItem.startMinutes);

  $: offset = $dragging
    ? roundToSnapStep(pointerYOffset - $pointerYOffsetToTaskStart)
    : initialOffset;

  $: offsetToPointer = pointerYOffset - initialOffset;

  $: height = $resizing
    ? roundToSnapStep(offsetToPointer)
    : $durationToSize(planItem.durationMinutes);

  $: relationToNow = isGhost
    ? "future"
    : getRelationToNow($currentTime, planItem.startTime, planItem.endTime);

  watch(editConfirmation, () => {
    confirmMove(offset, planItem.id, planItem.durationMinutes);
    confirmResize(planItem.id, height, planItem.startMinutes);
  });

  watch(editCancellation, () => {
    cancelMove();
    cancelResize();
  });
</script>

<div
  style:height="{height}px"
  style:transform="translateY({offset}px)"
  style:cursor={$cursor}
  style:width="{planItem.placing.widthPercent || 100}%"
  style:left="{planItem.placing.xOffsetPercent || 0}%"
  class="gap-box absolute-stretch-x"
>
  <div
    class="task {relationToNow}"
    class:is-completed={planItem.isCompleted}
    class:is-ghost={isGhost}
    class:past={relationToNow === "past"}
    class:present={relationToNow === "present"}
    on:mousedown|stopPropagation={(e) => {
      startMove(e);
    }}
  >
    {#if planItem.isTask}
      {#if planItem.isCompleted}
        <TaskCompletedIcon />
      {:else}
        <TaskCircleIcon />
      {/if}
    {/if}
    <RenderedMarkdown text={planItem.text} />
    <div
      class="resize-handle absolute-stretch-x"
      on:mousedown|stopPropagation={startResize}
    ></div>
  </div>
</div>

<style>
  .gap-box {
    display: flex;
    padding: 0 3px 1px;
    transition: 0.05s linear;
  }

  .task {
    overflow: hidden;
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

  .is-completed {
    color: var(--text-faint);
    text-decoration: line-through;
  }

  .resize-handle {
    cursor: s-resize;
    bottom: -15px;
    height: 30px;
  }
</style>
