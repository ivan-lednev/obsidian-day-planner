<script lang="ts">
  import { Lock } from "lucide-svelte";
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

  // todo: hide this in action
  $: if ($isModPressed && hovering && task.location.path) {
    showPreview(el, task.location.path, task.location.line);
  }
</script>

<div
  style:left="{task?.placing?.xOffsetPercent || 0}%"
  style:width="{task?.placing?.widthPercent || 100}%"
  class="task-padding-box"
>
  <div
    bind:this={el}
    class="task-block {relationToNow}"
    class:is-ghost={task.isGhost}
    class:readonly={task.calendar}
    on:mousedown={(event) => event.stopPropagation()}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    on:mouseup
  >
    <div class="text">
      {#if task.calendar}
        <div class="calendar">
          <Lock class="svg-icon lock-icon" />
          {task.calendar}
        </div>
      {/if}
      <RenderedMarkdown {task} />
    </div>
    {#if !task.calendar}
      <slot />
    {/if}
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

  .task-padding-box :global(svg.lock-icon) {
    width: var(--icon-xs);
    height: var(--icon-xs);
  }

  .calendar {
    display: flex;
    gap: var(--size-4-1);
    align-items: center;

    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }

  .text {
    display: flex;
    flex: 1 0 0;
    flex-direction: column;
  }

  .readonly {
    background: repeating-linear-gradient(
      45deg,
      var(--background-secondary),
      var(--background-secondary) 10px,
      var(--background-modifier-border) 10px,
      var(--background-modifier-border) 20px
    );
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
