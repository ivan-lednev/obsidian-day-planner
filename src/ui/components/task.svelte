<script lang="ts">
  import {
    appStore,
    getYCoords,
    hiddenHoursSize,
    zoomLevel,
  } from "../../store/timeline-store";
  import { fade } from "svelte/transition";
  import { Component, MarkdownRenderer } from "obsidian";
  import { onDestroy, onMount } from "svelte";

  export let text: string;
  export let startMinutes: number;
  export let durationMinutes: number;
  export let pointerYCoords: number;

  let markdownLifecycleManager = new Component();
  let el: HTMLDivElement;
  let dragging = false;
  let pointerOffsetY: number;

  $: height = `${durationMinutes * Number($zoomLevel)}px`;
  $: yCoords = dragging
    ? pointerYCoords - pointerOffsetY
    : $getYCoords(startMinutes);
  $: transform = `translateY(${yCoords}px)`;

  function handleMouseDown(event: MouseEvent) {
    pointerOffsetY = event.offsetY;
    dragging = true;
  }

  function handleMouseup() {
    dragging = false;
  }

  onMount(() => {
    document.addEventListener("mouseup", handleMouseup);
  });

  onDestroy(() => {
    markdownLifecycleManager.unload();
    document.removeEventListener("mouseup", handleMouseup);
  });

  $: if (el) {
    markdownLifecycleManager.unload();
    markdownLifecycleManager = new Component();

    el.empty();
    MarkdownRenderer.render($appStore, text, el, "", markdownLifecycleManager);
    markdownLifecycleManager.load();
  }
</script>

<div
  bind:this={el}
  class="task absolute-stretch-x"
  style:height
  style:transform
  on:mousedown={handleMouseDown}
  transition:fade={{ duration: 100 }}
></div>

<style>
  .task {
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;

    padding: 5px;

    font-size: var(--font-ui-medium);
    color: aliceblue;
    text-align: left;
    white-space: normal;

    background-color: var(--color-accent);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    box-shadow: none;

    transition: height 0.2s ease-in-out;
  }

  .task :global(p) {
    margin-block-start: 0;
    margin-block-end: 0;
  }
</style>
