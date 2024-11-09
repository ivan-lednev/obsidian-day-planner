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

  <div class="result-message">
    {$description}
  </div>
  {#if $result.length > 0}
    <div class="search-results-scroller">
      <div class="search-results">
        {#each $result as foundTimeBlock}
          <div class="search-result">
            <UnscheduledTimeBlock
              --time-block-padding="var(--size-4-1)"
              onGripMouseDown={handleUnscheduledTaskGripMouseDown}
              onMouseUp={() => {}}
              task={foundTimeBlock}
            />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .result-message,
  .search-results {
    margin: var(--size-4-2) var(--size-4-3);
  }

  input {
    flex-shrink: 0;
    margin: var(--size-4-2) var(--size-4-3) 0;
  }

  .search-result:not(:last-child) {
    border-bottom: 1px solid var(--background-modifier-border);
  }

  .result-message {
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
  }

  .search-results-scroller {
    overflow-y: auto;
    border-top: 1px solid var(--background-modifier-border);
  }

  .search-results {
    display: flex;
    flex-direction: column;

    background-color: var(
      --search-results-bg-color,
      var(--background-secondary)
    );
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
  }

  .search-wrapper {
    display: flex;
    flex-direction: column;
    max-height: var(--search-max-height, 100%);
  }
</style>
