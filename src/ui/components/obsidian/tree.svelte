<script lang="ts">
  import RightTriangle from "./right-triangle.svelte";
  import { type Snippet } from "svelte";

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
    {@render children()}
  {/if}
</div>

<style>
  .tree-container {
    display: flex;
    flex: var(--flex);
    flex-direction: column;
    gap: var(--size-4-1);
  }

  .tree-item-inner {
    font-weight: var(--font-medium);
  }
</style>
