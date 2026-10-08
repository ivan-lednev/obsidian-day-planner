<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    cursor?: string;
    label: string;
  }

  const { children, cursor = "", label, ...rest }: Props = $props();
</script>

<div style:cursor class="clickable-icon" aria-label={label} {...rest}>
  {@render children()}
</div>

<style>
  .clickable-icon {
    padding: var(--size-2-2) var(--size-4-2);
  }
</style>
