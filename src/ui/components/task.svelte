<script lang="ts">
  import type { UnscheduledPlanItem } from "../../types";

  import RenderedMarkdown from "./rendered-markdown.svelte";

  export let planItem: UnscheduledPlanItem;
  // todo: this should live in useTaskVisuals
  export let relationToNow = "";
</script>

<div
  style:width="{planItem?.placing?.widthPercent || 100}%"
  style:left="{planItem?.placing?.xOffsetPercent || 0}%"
  class="task-padding-box"
>
  <div
    class="task-block {relationToNow}"
    class:is-ghost={planItem.isGhost}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseup
  >
    <RenderedMarkdown text={planItem.text} />
    <slot />
  </div>
</div>

<style>
  .task-padding-box {
    display: flex;
    padding: 0 1px 2px;
    transition: 0.05s linear;
    position: var(--position, static);
    top: var(--offset);
    height: var(--task-height);
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
    background-color: var(--task-background-color, var(--background-primary));
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
