<script lang="ts">
  import { appStore, getYCoords, zoomLevel } from "../../store/timeline-store";
  import { fade } from "svelte/transition";
  import { Component, MarkdownRenderer } from "obsidian";
  import { onDestroy, onMount } from "svelte";

  export let text: string;
  export let startMinutes: number;
  export let durationMinutes: number;

  const markdownLifecycleManager = new Component();
  let el: HTMLDivElement;

  $: height = `${durationMinutes * Number($zoomLevel)}px`;

  $: yCoords = $getYCoords(startMinutes);
  $: transform = `translateY(${yCoords}px)`;

  onMount(() => markdownLifecycleManager.load());
  onDestroy(() => markdownLifecycleManager.onunload());

  $: if (el) {
    el.empty();
    MarkdownRenderer.render($appStore, text, el, "", markdownLifecycleManager);
  }
</script>

<div
  bind:this={el}
  class="task absolute-stretch-x"
  style:height
  style:transform
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
