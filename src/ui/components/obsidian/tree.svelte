<script lang="ts">
  import { type Snippet } from "svelte";
  import { slide } from "svelte/transition";

  import { createSlide } from "../defaults";

  import RightTriangle from "./right-triangle.svelte";

  const { children, title }: { children: Snippet; title: string } = $props();
  let isTreeVisible = $state(false);

  const titleColor = $derived(
    isTreeVisible ? "var(--text-muted)" : "var(--text-faint)",
  );

  function toggleTree() {
    isTreeVisible = !isTreeVisible;
  }
</script>

<div class="tree-container">
  <div class="tree-item-self is-clickable" onclick={toggleTree}>
    <div
      class="tree-item-icon collapse-icon"
      class:is-collapsed={!isTreeVisible}
    >
      <RightTriangle />
    </div>
    <div style:color={titleColor} class="tree-item-inner">{title}</div>
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
