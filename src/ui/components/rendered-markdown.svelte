<script lang="ts">
  import { Component, MarkdownRenderer } from "obsidian";
  import { getContext, onDestroy } from "svelte";

  import { obsidianContext } from "../../constants";
  import type { ObsidianContext } from "../../types";

  export let text: string;

  let markdownLifecycleManager = new Component();
  let el: HTMLDivElement;

  const { obsidianFacade } = getContext<ObsidianContext>(obsidianContext);

  onDestroy(() => {
    markdownLifecycleManager.unload();
  });

  $: if (el) {
    markdownLifecycleManager.unload();
    markdownLifecycleManager = new Component();

    el.empty();
    MarkdownRenderer.render(
      obsidianFacade.app,
      text,
      el,
      "",
      markdownLifecycleManager,
    );
    markdownLifecycleManager.load();

    el.querySelectorAll(`input[type="checkbox"]`)?.forEach((checkbox) =>
      checkbox.setAttribute("disabled", "true"),
    );
  }
</script>

<div bind:this={el} class="rendered-markdown"></div>

<style>
  .rendered-markdown {
    --checkbox-size: var(--font-ui-small);

    flex: 1 0 0;
    color: var(--text-normal);
  }

  .rendered-markdown :global(p),
  .rendered-markdown :global(ul) {
    margin-block-start: 0;
    margin-block-end: 0;
  }

  .rendered-markdown :global(ul),
  .rendered-markdown :global(ol) {
    padding-inline-start: 20px;
  }

  .rendered-markdown :global(input[type="checkbox"]) {
    top: 2px;
    margin-inline-end: 4px;
    border-color: var(--text-muted);
  }

  .rendered-markdown :global(li) {
    color: var(--text-normal);
  }

  .rendered-markdown :global(li.task-list-item[data-task="x"]),
  .rendered-markdown :global(li.task-list-item[data-task="X"]) {
    color: var(--text-muted);
  }
</style>
