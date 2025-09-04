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
    flair?: Snippet;
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
      class={[
        "tree-item-icon",
        "collapse-icon",
        !isTreeVisible && "is-collapsed",
      ]}
    >
      <RightTriangle />
    </div>
    <div style:color={titleColor} class="tree-item-inner">{title}</div>
    {#if flair}
      <div class="tree-item-flair-outer">
        <span class="tree-item-flair">{@render flair()}</span>
      </div>
    {/if}
  </div>
  {#if isTreeVisible}
    <div
      class="transition-wrapper"
      transition:slide={createSlide({ axis: "y" })}
    >
      {@render children()}
    </div>
  {/if}
</div>

<style>
  .transition-wrapper,
  .tree-container {
    display: flex;
    flex: var(--flex);
    flex-direction: column;
  }

  .tree-container {
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .tree-item-inner {
    font-weight: var(--font-medium);
  }

  .tree-item-self {
    margin-bottom: 0;
    border-radius: 0;
  }

  .tree-item-flair-outer {
    align-self: center;
  }

  .tree-item-flair {
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    height: var(--icon-xs);
  }
</style>
