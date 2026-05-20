<script generics="T extends { id?: string }" lang="ts">
  import type { Snippet } from "svelte";
  import { slide } from "svelte/transition";

  import { createSlide } from "./defaults";

  const {
    list,
    match,
    titleMatch,
  }: {
    // eslint-disable-next-line no-undef
    match: Snippet<[T]>;
    titleMatch?: Snippet<[string]>;
    // eslint-disable-next-line no-undef
    list: Array<T> | Record<string, Array<T>>;
  } = $props();
</script>

<!-- eslint-disable-next-line no-undef -->
{#snippet renderList(list: Array<T>)}
  {#each list as foundTimeBlock, index (foundTimeBlock.id || index)}
    {@render match(foundTimeBlock)}
  {/each}
{/snippet}

{#if Array.isArray(list) && list.length > 0}
  <div
    class="search-results-scroller"
    transition:slide={createSlide({ axis: "y" })}
  >
    {@render renderList(list)}
  </div>
{:else if Object.keys(list).length > 0}
  <div
    class="search-results-scroller"
    transition:slide={createSlide({ axis: "y" })}
  >
    {#each Object.entries(list) as [sectionTitle, foundTimeBlocks], index (sectionTitle || index)}
      {@render titleMatch?.(sectionTitle)}
      {@render renderList(foundTimeBlocks)}
    {/each}
  </div>
{/if}

<style>
  .search-results-scroller {
    overflow-y: auto;
    padding: var(--size-4-1) var(--size-4-2);
  }
</style>
