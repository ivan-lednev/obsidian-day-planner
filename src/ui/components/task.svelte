<script lang="ts">
  import { GripVertical, Copy, Layers } from "lucide-svelte";
  import type { Readable } from "svelte/store";

  import { currentTime } from "../../global-stores/current-time";
  import { settingsWithUtils } from "../../global-stores/settings-with-utils";
  import type { PlacedPlanItem, PlanItem } from "../../types";
  import { useTask } from "../hooks/use-task";

  import RenderedMarkdown from "./rendered-markdown.svelte";

  export let copyModifierPressed: boolean;
  export let shiftOthersModifierPressed: boolean;
  export let planItem: PlacedPlanItem;
  export let pointerOffsetY: Readable<number>;
  export let onMouseUp: (planItem: PlanItem) => Promise<void>;
  export let onCopy: () => void;
  export let onGripClick: () => void;
  export let onResizeStart: () => void;

  $: ({
    height,
    offset,
    relationToNow,
    backgroundColor,
    properContrastColors,
    handleMouseUp,
  } = useTask(planItem, {
    settings: settingsWithUtils,
    cursorOffsetY: pointerOffsetY,
    currentTime,
    onMouseUp,
  }));
</script>

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
    class:is-ghost={planItem.isGhost}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseup={handleMouseUp}
  >
    <RenderedMarkdown
      --text-faint={$properContrastColors.faint}
      --text-muted={$properContrastColors.muted}
      --text-normal={$properContrastColors.normal}
      text={planItem.text}
    />
    {#if !planItem.isGhost}
      {#if copyModifierPressed}
        <div class="grip" on:mousedown|stopPropagation={onCopy}>
          <Copy class="svg-icon" />
        </div>
      {:else if shiftOthersModifierPressed}
        <div class="grip" on:mousedown|stopPropagation={onGripClick}>
          <Layers class="svg-icon" />
        </div>
      {:else}
        <div class="grip" on:mousedown|stopPropagation={onGripClick}>
          <GripVertical class="svg-icon" />
        </div>
      {/if}
    {/if}
    <div
      class="resize-handle"
      on:mousedown|stopPropagation={onResizeStart}
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

    position: absolute;
    right: 0;
    bottom: -8px;
    left: 0;

    height: 16px;
  }
</style>
