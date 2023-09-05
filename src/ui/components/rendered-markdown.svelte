<script lang="ts">
  import { Component, MarkdownRenderer } from "obsidian";
  import { onDestroy } from "svelte";

  import { appStore } from "../../store/app-store";
  import type { IContrastColors } from "../../util/color";

  export let text: string;
  export let properContrastColors: IContrastColors;

  let markdownLifecycleManager = new Component();
  let el: HTMLDivElement;

  // todo: this should be hidden in an action
  onDestroy(() => {
    markdownLifecycleManager.unload();
  });

  $: if (el) {
    markdownLifecycleManager.unload();
    markdownLifecycleManager = new Component();

    el.empty();
    MarkdownRenderer.render($appStore, text, el, "", markdownLifecycleManager);
    markdownLifecycleManager.load();

    el.querySelectorAll(`input[type="checkbox"]`)?.forEach((checkbox) =>
      checkbox.setAttribute("disabled", "true"),
    );
  }
</script>

<div bind:this={el}
     style="

     --text-normal: {properContrastColors.normal};
     --text-muted: {properContrastColors.muted};
     --text-faint: {properContrastColors.faint}
    "
     class="rendered-markdown"></div>

<style>
  .rendered-markdown {
    --checkbox-size: var(--font-ui-small);

    flex: 1 0 0;
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
    color: var(--text-normal) !important;
  }
</style>
