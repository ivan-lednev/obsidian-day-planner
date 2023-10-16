<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { PlacedPlanItem } from "../../types";
  import { useTaskVisuals } from "../hooks/use-task-visuals";

  import RenderedMarkdown from "./rendered-markdown.svelte";

  export let planItem: PlacedPlanItem;
  export let onResizeStart: (event: MouseEvent) => void;

  $: ({ height, offset, relationToNow, backgroundColor, properContrastColors } =
    useTaskVisuals(planItem, {
      settings,
      currentTime,
    }));
</script>

<div
  style:height="{$height}px"
  style:top="{$offset}px"
  style:width="{planItem.placing.widthPercent || 100}%"
  style:left="{planItem.placing.xOffsetPercent || 0}%"
  class="gap-box absolute-stretch-x"
>
  <div
    style:background-color={$backgroundColor}
    class="task {$relationToNow}"
    class:is-ghost={planItem.isGhost}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseup
  >
    <RenderedMarkdown
      --text-faint={$properContrastColors.faint}
      --text-muted={$properContrastColors.muted}
      --text-normal={$properContrastColors.normal}
      text={planItem.text}
    />
    <slot />
    {#if !planItem.isGhost}
      <hr
        class="workspace-leaf-resize-handle"
        on:mousedown|stopPropagation={onResizeStart}
      />
    {/if}
  </div>
</div>

<style>
  :not(#dummy).workspace-leaf-resize-handle {
    cursor: row-resize;

    right: 0;
    bottom: 0;
    left: 0;

    display: block; /* obsidian hides them sometimes, we don't want that */

    height: calc(var(--divider-width-hover) * 2);

    border-bottom-width: var(--divider-width);
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
</style>
