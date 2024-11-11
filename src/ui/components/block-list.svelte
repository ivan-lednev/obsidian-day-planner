<script generics="T" lang="ts">
  import type { Snippet } from "svelte";

  // eslint doesn't know about Svelte generics
  // eslint-disable-next-line no-undef
  const { list, match }: { match: Snippet<[T]>; list: Array<T> } = $props();
</script>

{#if list.length > 0}
  <div class="search-results-scroller">
    <div class="search-results">
      {#each list as foundTimeBlock}
        <div class="search-result">
          {@render match(foundTimeBlock)}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .search-results-scroller {
    overflow-y: auto;
    border-top: 1px solid var(--background-modifier-border);
  }

  .search-results {
    display: flex;
    flex-direction: column;

    margin: var(--size-4-2) var(--size-4-3);

    background-color: var(
      --search-results-bg-color,
      var(--background-secondary)
    );
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
  }

  .search-result:not(:last-child) {
    border-bottom: 1px solid var(--background-modifier-border);
  }
</style>
