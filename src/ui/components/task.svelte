<script lang="ts">
  import { GripVertical } from "lucide-svelte";
  import type { Readable } from "svelte/store";

  import { currentTime } from "../../global-stores/current-time";
  import { editCancellation, editConfirmation } from "../../global-stores/edit-events";
  import { settingsWithUtils } from "../../global-stores/settings-with-utils";
  import type { PlacedPlanItem, PlanItem } from "../../types";
  import { useTask } from "../hooks/use-task";
  import { watch } from "../hooks/watch";

  import RenderedMarkdown from "./rendered-markdown.svelte";

  export let planItem: PlacedPlanItem;
  export let pointerYOffset: Readable<number>;
  export let isGhost = false;
  export let onUpdate: (updated: PlanItem) => Promise<void>;
  export let onMouseUp: (planItem: PlanItem) => Promise<void>;

  const {
    height,
    offset,
    relationToNow,
    cursor,
    startMove,
    confirmMove,
    cancelMove,
    cancelResize,
    startResize,
    confirmResize,
    backgroundColor,
    properContrastColors,
    handleMouseUp,
  } = useTask(planItem, {
    settings: settingsWithUtils,
    cursorOffsetY: pointerYOffset,
    currentTime,
    isGhost,
    onUpdate,
    onMouseUp,
  });

  // todo: no global variables
  watch(editConfirmation, () => {
    confirmMove();
    confirmResize();
  });

  watch(editCancellation, () => {
    cancelMove();
    cancelResize();
  });
</script>

<!--  overwrite global theme colors with contrasting text colors, when using colored theme-->
<div
  style:height="{$height}px"
  style:transform="translateY({$offset}px)"
  style:width="{planItem.placing.widthPercent || 100}%"
  style:left="{planItem.placing.xOffsetPercent || 0}%"
  class="gap-box absolute-stretch-x"
>
  <div
    style:background-color={$backgroundColor}
    class="task {$relationToNow}"
    class:is-ghost={isGhost}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseup={handleMouseUp}
  >
    <RenderedMarkdown
      --text-faint={$properContrastColors.faint}
      --text-muted={$properContrastColors.muted}
      --text-normal={$properContrastColors.normal}
      text={planItem.text}
    />
    <div
      style:cursor={$cursor}
      class="grip"
      on:mousedown|stopPropagation={startMove}
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
    text-align: left;
    overflow-wrap: anywhere;
    white-space: normal;

    border: 1px solid var(--color-base-50);
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

  .resize-handle {
    cursor: s-resize;
    bottom: -8px;
    height: 16px;
  }
</style>
