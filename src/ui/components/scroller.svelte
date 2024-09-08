<script lang="ts">
  import type { Snippet } from "svelte";

  const { children }: { children: Snippet<[boolean]> } = $props();

  let isUnderCursor = $state(false);
</script>

<div
  class="scroller"
  on:mouseenter={() => {
    isUnderCursor = true;
  }}
  on:mouseleave={() => {
    isUnderCursor = false;
  }}
  on:scroll
>
  <div class="stretcher">
    {@render children(isUnderCursor)}
  </div>
</div>

<style>
  .scroller {
    overflow: auto;
    flex: 1 0 0;
    background-color: var(--background-secondary);
  }

  .stretcher {
    display: flex;
  }
</style>
