<script lang="ts">
  import RenderedMarkdown from "./rendered-markdown.svelte";

  import { fade } from "svelte/transition";
  import { getYCoords, zoomLevel } from "../../store/timeline-store";

  export let text: string;
  export let startMinutes: number | undefined = undefined;
  export let durationMinutes: number;
  export let pointerYCoords: number;
  export let isGhost = false;

  let el: HTMLDivElement;
  let dragging = false;
  let resizing = false;
  let pointerYWithinTask: number;

  $: defaultYCoords = startMinutes ? $getYCoords(startMinutes) : pointerYCoords;

  $: height = `${
    resizing
      ? pointerYCoords - defaultYCoords
      : durationMinutes * Number($zoomLevel)
  }px`;
  $: yCoords = dragging ? pointerYCoords - pointerYWithinTask : defaultYCoords;
  $: transform = `translateY(${yCoords}px)`;
  $: cursor = dragging ? "grabbing" : "grab";

  function handleMouseDown(event: MouseEvent) {
    event.stopPropagation()
    pointerYWithinTask = event.offsetY;
    dragging = true;
  }

  function handleMouseup() {
    dragging = resizing = false;
  }

  function handleResize(event: MouseEvent) {
    event.stopPropagation();
    resizing = true;
  }
</script>

<svelte:document on:mouseup={handleMouseup} />

<div
  bind:this={el}
  class="task absolute-stretch-x"
  class:is-ghost={isGhost}
  style:height
  style:transform
  style:cursor
  on:mousedown={handleMouseDown}
  transition:fade={{ duration: 100 }}
>
  <RenderedMarkdown {text} />
  <div
    class="resize-handle absolute-stretch-x"
    on:mousedown={handleResize}
  ></div>
</div>

<style>
  .task {
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;

    padding: 5px;

    font-size: var(--font-ui-medium);
    color: var(--text-muted);
    text-align: left;
    white-space: normal;

    background-color: var(--background-primary);
    border: 1px solid var(--color-accent);
    border-radius: var(--radius-s);
    box-shadow: none;
  }

  .is-ghost {
    opacity: 60%;
  }

  .task:hover {
    cursor: grab;
  }

  .resize-handle {
    bottom: -10px;
    height: 20px;
    cursor: s-resize;
  }
</style>
