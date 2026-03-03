<script lang="ts">
  import type { Snippet } from "svelte";

  const { children }: { children: Snippet } = $props();
</script>

<pre class="error-message">{@render children()}</pre>

<style>
  .error-message {
    overflow-x: auto;

    width: 100%;
    margin-block: 0;
    padding: var(--size-4-1);

    border: 1px solid var(--text-error);
    border-radius: var(--radius-s);
  }
</style>
