<script lang="ts">
  import { GripVertical } from "lucide-svelte";
  import { MarkdownView } from "obsidian";

  import { appStore } from "../../store/app-store";
  import { currentTime } from "../../store/current-time";
  import { editCancellation, editConfirmation } from "../../store/edit-events";
  import {
    durationToSize,
    roundToSnapStep,
    timeToTimelineOffset,
  } from "../../store/timeline-store";
  import type { PlacedPlanItem } from "../../types";
  import { getRelationToNow } from "../../util/moment";
  import { getFileByPath, openFileInEditor } from "../../util/obsidian";
  import { useDrag } from "../hooks/use-drag";
  import { useResize } from "../hooks/use-resize";
  import { watch } from "../hooks/watch";

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
  style:width="{planItem.placing.widthPercent || 100}%"
  style:left="{planItem.placing.xOffsetPercent || 0}%"
  class="gap-box absolute-stretch-x"
>
  <div
    class="task {relationToNow}"
    class:is-ghost={isGhost}
    class:past={relationToNow === "past"}
    class:present={relationToNow === "present"}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseup={async () => {
      if (isGhost || $dragging) {
        return;
      }

      const file = getFileByPath(planItem.location.path);

      const editor = await openFileInEditor(file);
      $appStore.workspace
        .getActiveViewOfType(MarkdownView)
        ?.setEphemeralState({ line: planItem.location.line });

      editor.setCursor({ line: planItem.location.line, ch: 0 });
    }}
  >
    <RenderedMarkdown text={planItem.text} />
    <div
      style:cursor={$cursor}
      class="grip"
      on:mousedown|stopPropagation={(e) => {
        startMove(e);
      }}
    >
      <GripVertical class="svg-icon" />
    </div>
    <div
      class="resize-handle absolute-stretch-x"
      on:mousedown|stopPropagation={startResize}
    ></div>
  </div>
</div>

<style>
  .grip {
    position: relative;
    right: -4px;

    grid-column: 2;
    align-self: flex-start;

    color: var(--text-faint);
  }

  .grip:hover {
    color: var(--text-muted);
  }

  .gap-box {
    display: flex;
    padding: 0 1px 2px;
    transition: 0.05s linear;
  }

  .task {
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 0 0;

    padding: 4px 6px 6px;

    font-size: var(--font-ui-small);
    color: var(--text-muted);
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    background-color: var(--background-primary);
    border: 1px solid var(--text-faint);
    border-radius: var(--radius-s);
  }

  .task:hover {
    border-color: var(--text-muted);
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

  .resize-handle {
    cursor: s-resize;
    bottom: -8px;
    height: 16px;
  }
</style>
