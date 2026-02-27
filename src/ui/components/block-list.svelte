<script generics="T" lang="ts">
  import type { Snippet } from "svelte";
  import { slide } from "svelte/transition";

  import { createSlide } from "./defaults";

  // eslint doesn't know about Svelte generics
  // eslint-disable-next-line no-undef
  const { list, match }: { match: Snippet<[T]>; list: Array<T> } = $props();
</script>

{#if list.length > 0}
  <div
    class="search-results-scroller"
    transition:slide={createSlide({ axis: "y" })}
  >
    {#each list as foundTimeBlock}
      {@render match(foundTimeBlock)}
    {/each}
  </div>
{/if}

<style>
  .search-results-scroller {
    overflow-y: auto;
    padding: var(--size-4-1) var(--size-4-2);
  }
</style>
