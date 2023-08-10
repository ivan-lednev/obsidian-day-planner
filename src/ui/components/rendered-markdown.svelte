<script lang="ts">
  import { Component, MarkdownRenderer } from "obsidian";
  import { onDestroy } from "svelte";
  import { appStore } from "../../store/timeline-store";

  export let text: string;

  let markdownLifecycleManager = new Component();
  let renderedMarkdown: HTMLDivElement;

  onDestroy(() => {
    markdownLifecycleManager.unload();
  });

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

<div bind:this={renderedMarkdown} class="rendered-markdown"></div>

<style>
  .rendered-markdown :global(p) {
    margin-block-start: 0;
    margin-block-end: 0;
  }
</style>
