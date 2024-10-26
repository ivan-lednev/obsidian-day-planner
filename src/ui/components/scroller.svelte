<script lang="ts">
  import type { Snippet } from "svelte";

  const {
    children,
    className,
  }: { children: Snippet<[boolean]>; className?: string } = $props();

  let isUnderCursor = $state(false);
</script>

<div
  class="scroller {className}"
  on:mouseenter={() => {
    isUnderCursor = true;
  }}
  on:mouseleave={() => {
    isUnderCursor = false;
  }}
  on:scroll
>
  {@render children(isUnderCursor)}
</div>

<style>
  .scroller {
    overflow: auto;
    display: flex;
    flex: 1 0 0;
    background-color: var(--background-secondary);
  }
</style>
