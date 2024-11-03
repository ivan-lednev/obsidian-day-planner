<script lang="ts">
  import type { ObsidianContext } from "../../types";
  import { obsidianContext } from "../../constants";
  import { getContext } from "svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const {
    search,
    editContext: {
      handlers: { handleUnscheduledTaskGripMouseDown },
    },
  } = getContext<ObsidianContext>(obsidianContext);
</script>

<div class="search-wrapper">
  <input
    bind:value={search.query}
    placeholder="Search for tasks across the vault"
    spellcheck="false"
    type="text"
  />

  {#if search.result.length > 0}
    <div class="search-results">
      {#each search.result as foundTimeBlock}
        <UnscheduledTimeBlock
          onGripMouseDown={handleUnscheduledTaskGripMouseDown}
          onMouseUp={() => {}}
          task={foundTimeBlock}
        />
      {/each}
    </div>
  {/if}
</div>

<style>
  .search-results {
    padding: var(--size-4-1);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    background-color: var(--background-secondary-alt);
  }

  .search-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);
  }
</style>
