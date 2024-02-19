<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import type { ObsidianContext, UnscheduledTask } from "../../types";

  import RenderedMarkdown from "./rendered-markdown.svelte";

  export let task: UnscheduledTask;
  // TODO: this should live in useTaskVisuals
  export let relationToNow = "";

  const { showPreview, isModPressed } =
    getContext<ObsidianContext>(obsidianContext);
  let el: HTMLDivElement;
  let hovering = false;

  function handleMouseEnter() {
    hovering = true;
  }

  function handleMouseLeave() {
    hovering = false;
  }

  $: if ($isModPressed && hovering && task.location.path) {
    showPreview(el, task.location.path, task.location.line);
  }
</script>

<div
  style:width="{task?.placing?.widthPercent || 100}%"
  style:left="{task?.placing?.xOffsetPercent || 0}%"
  class="task-padding-box"
>
  <div
    bind:this={el}
    class="task-block {relationToNow}"
    class:is-ghost={task.isGhost}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:mouseup
  >
    <RenderedMarkdown {task} />
    <slot />
  </div>
</div>

<style>
  .task-padding-box {
    position: var(--task-position, static);
    top: var(--task-offset);
    left: 0;

    display: flex;

    width: 100%;
    height: var(--task-height, auto);
    padding: 0 1px 2px;

    transition: 0.05s linear;
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

    background-color: var(--task-background-color, var(--background-primary));
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
