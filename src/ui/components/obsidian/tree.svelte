<script lang="ts">
  import { type Snippet } from "svelte";
  import { slide } from "svelte/transition";

  import { createSlide } from "../defaults";

  import RightTriangle from "./right-triangle.svelte";

  const {
    children,
    title,
    flair,
    isInitiallyOpen,
  }: {
    children: Snippet;
    title: string;
    flair?: string;
    isInitiallyOpen?: boolean;
  } = $props();

  let isTreeVisible = $state(isInitiallyOpen);

  const titleColor = $derived(
    isTreeVisible ? "var(--text-muted)" : "var(--text-faint)",
  );

  function toggleTree() {
    isTreeVisible = !isTreeVisible;
  }
</script>

<!--Partially uses Obsidian's classes for search result matches-->
<div class="tree-container">
  <div class="tree-item-self is-clickable" onclick={toggleTree}>
    <div
      class="tree-item-icon collapse-icon"
      class:is-collapsed={!isTreeVisible}
    >
      <RightTriangle />
    </div>
    <div style:color={titleColor} class="tree-item-inner">{title}</div>
    {#if flair}
      <div class="tree-item-flair-outer">
        <span class="tree-item-flair">{flair}</span>
      </div>
    {/if}
  </div>
  {#if isTreeVisible}
    <div transition:slide={createSlide({ axis: "y" })}>
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .tree-container {
    display: flex;
    flex: var(--flex);
    flex-direction: column;
  }

  .tree-item-inner {
    font-weight: var(--font-medium);
  }

  .tree-item-self {
    margin-bottom: 0;
    border-radius: 0;
  }
</style>
