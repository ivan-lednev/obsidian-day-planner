<script lang="ts">
  import type { Snippet } from "svelte";

  const {
    children,
    className,
    onscroll,
  }: {
    children: Snippet<[boolean]>;
    className?: string;
    onscroll?: (event: Event) => void;
  } = $props();

  let isUnderCursor = $state(false);
</script>

<div
  class="scroller {className}"
  onmouseenter={() => {
    isUnderCursor = true;
  }}
  onmouseleave={() => {
    isUnderCursor = false;
  }}
  {onscroll}
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
