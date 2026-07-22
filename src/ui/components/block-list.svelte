<script generics="T extends { id?: string }" lang="ts">
  import type { Snippet } from "svelte";

  const {
    list,
    match,
    fallback,
    titleMatch,
    className,
    onpointerup,
    onpointermove,
  }: {
    // eslint-disable-next-line no-undef
    match: Snippet<[T]>;
    fallback?: Snippet;
    titleMatch?: Snippet<[string]>;
    // eslint-disable-next-line no-undef
    list: Array<T> | Record<string, Array<T>>;
    className?: string;
    onpointerup?: (event: PointerEvent) => void;
    onpointermove?: (event: PointerEvent) => void;
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
    class={["search-results-scroller", className]}
    {onpointermove}
    {onpointerup}
  >
    {@render renderList(list)}
  </div>
{:else if Object.keys(list).length > 0}
  <div
    class={["search-results-scroller", className]}
    {onpointermove}
    {onpointerup}
  >
    {#each Object.entries(list) as [sectionTitle, foundTimeBlocks], index (sectionTitle || index)}
      {@render titleMatch?.(sectionTitle)}
      {@render renderList(foundTimeBlocks)}
    {/each}
  </div>
{:else}
  {@render fallback?.()}
{/if}

<style>
  .search-results-scroller {
    overflow-y: auto;
    padding: var(--block-list-padding, var(--size-4-1) var(--size-4-2));
  }
</style>
