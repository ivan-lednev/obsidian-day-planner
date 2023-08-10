<script lang="ts">
  import { appStore, getYCoords, zoomLevel } from "../../store/timeline-store";
  import { fade } from "svelte/transition";
  import { Component, MarkdownRenderer } from "obsidian";
  import { onDestroy, onMount } from "svelte";

  export let text: string;
  export let startMinutes: number;
  export let durationMinutes: number;
  export let pointerYCoords: number;

  let markdownLifecycleManager = new Component();
  let el: HTMLDivElement;
  let renderedMarkdown: HTMLDivElement;
  let dragging = false;
  let resizing = false;
  let pointerYWithinTask: number;

  $: defaultYCoords = $getYCoords(startMinutes);

  $: height = `${
    resizing
      ? pointerYCoords - defaultYCoords
      : durationMinutes * Number($zoomLevel)
  }px`;
  $: yCoords = dragging ? pointerYCoords - pointerYWithinTask : defaultYCoords;
  $: transform = `translateY(${yCoords}px)`;
  $: cursor = dragging ? "grabbing" : "grab";

  function handleMouseDown(event: MouseEvent) {
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

  onDestroy(() => {
    markdownLifecycleManager.unload();
  });

  $: console.log(pointerYCoords);

  $: if (renderedMarkdown) {
    markdownLifecycleManager.unload();
    markdownLifecycleManager = new Component();

    renderedMarkdown.empty();
    MarkdownRenderer.render(
      $appStore,
      text,
      renderedMarkdown,
      "",
      markdownLifecycleManager,
    );
    markdownLifecycleManager.load();
  }
</script>

<svelte:document on:mouseup={handleMouseup} />

<div
  bind:this={el}
  class="task absolute-stretch-x"
  style:height
  style:transform
  style:cursor
  on:mousedown={handleMouseDown}
  transition:fade={{ duration: 100 }}
>
  <div bind:this={renderedMarkdown} class="rendered-markdown"></div>
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

  .task:hover {
    cursor: grab;
  }

  .rendered-markdown :global(p) {
    margin-block-start: 0;
    margin-block-end: 0;
  }

  .resize-handle {
    bottom: -10px;
    height: 20px;
    cursor: s-resize;
  }
</style>
