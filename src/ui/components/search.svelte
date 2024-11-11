<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask } from "../../task-types";

  import BlockList from "./block-list.svelte";
  import UnscheduledTimeBlock from "./unscheduled-time-block.svelte";

  const {
    search: { query, result, description },
    editContext: {
      handlers: { handleSearchResultGripMouseDown, handleTaskMouseUp },
    },
  } = getObsidianContext();
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

  <BlockList list={$result}>
    {#snippet match(task: LocalTask)}
      <UnscheduledTimeBlock
        --time-block-padding="var(--size-4-1)"
        onGripMouseDown={handleSearchResultGripMouseDown}
        onpointerup={() => {
          handleTaskMouseUp(task);
        }}
        {task}
      />
    {/snippet}
  </BlockList>
</div>

<style>
  input {
    flex-shrink: 0;
    margin: var(--size-4-2) var(--size-4-3) 0;
  }

  .result-message {
    margin: var(--size-4-2) var(--size-4-3);
    font-size: var(--font-ui-smaller);
    color: var(--text-faint);
  }

  .search-wrapper {
    display: flex;
    flex-direction: column;
    max-height: var(--search-max-height, 100%);
  }
</style>
