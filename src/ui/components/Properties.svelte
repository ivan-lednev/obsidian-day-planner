<script lang="ts">
  import type { Snippet } from "svelte";

  const props: { children: Snippet } = $props();
</script>

<div class="properties-wrapper">
  {@render props.children()}
</div>

<style>
  .properties-wrapper {
    display: flex;
    gap: var(--size-4-1);
    align-items: center;
    padding: var(--size-4-1);
  }
</style>
