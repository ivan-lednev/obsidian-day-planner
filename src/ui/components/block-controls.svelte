<script lang="ts">
  import type { Snippet } from "svelte";

  const { children }: { children: Snippet } = $props();
</script>

<div class="block-controls">
  {@render children()}
</div>

<style>
  .block-controls {
    --icon-size: var(--icon-xs);

    display: flex;
    align-items: flex-start;
    padding: var(--size-4-1);
  }
</style>
