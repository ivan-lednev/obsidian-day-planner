<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import type { ObsidianContext } from "../../types";

  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const {
    search: { query, result, description },
    editContext: {
      handlers: { handleUnscheduledTaskGripMouseDown },
    },
  } = getContext<ObsidianContext>(obsidianContext);
</script>

<div class="search-wrapper">
  <input
    placeholder="Search for tasks across the vault"
    spellcheck="false"
    type="text"
    bind:value={$query}
  />

  {#if $description}
    <div class="result-message">
      {$description}
    </div>
  {/if}
  {#if $result.length > 0}
    <div class="scroller">
      <div class="search-results">
        {#each $result as foundTimeBlock}
          <UnscheduledTimeBlock
            onGripMouseDown={handleUnscheduledTaskGripMouseDown}
            onMouseUp={() => {}}
            task={foundTimeBlock}
          />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .result-message {
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
  }

  .scroller {
    overflow-y: auto;
  }

  .search-results {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);

    padding: var(--size-4-1);

    background-color: var(--background-secondary);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
  }

  .search-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--size-4-1);
    max-height: 100%;
  }
</style>
