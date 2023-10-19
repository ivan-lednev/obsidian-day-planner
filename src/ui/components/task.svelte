<script lang="ts">
  import { currentTime } from "../../global-store/current-time";
  import { settings } from "../../global-store/settings";
  import type { PlanItem } from "../../types";
  import { useTaskVisuals } from "../hooks/use-task-visuals";

  import RenderedMarkdown from "./rendered-markdown.svelte";

  export let planItem: PlanItem;

  $: ({ height, offset, relationToNow, backgroundColor, properContrastColors } =
    useTaskVisuals(planItem, {
      settings,
      currentTime,
    }));
</script>

<div
  style:height="{$height}px"
  style:top="{$offset}px"
  style:width="{planItem?.placing?.widthPercent || 100}%"
  style:left="{planItem?.placing?.xOffsetPercent || 0}%"
  class="task-padding-box"
>
  <div
    style:background-color={$backgroundColor}
    class="task-block {$relationToNow}"
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
  </div>
</div>

<style>
  .task-padding-box {
    display: flex;
    padding: 0 1px 2px;
    transition: 0.05s linear;
    position: var(--position, absolute);
    left: 0;
    width: 100%;
  }

  .task-block {
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
