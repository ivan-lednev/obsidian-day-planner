<script lang="ts">
  import { getObsidianContext } from "../../context/obsidian-context";
  import {
    queryUpdated,
    selectLimitedSearchResult,
    selectQuery,
    selectSearchDescription,
  } from "../../redux/search-slice";
  import type { LocalTask } from "../../task-types";

  import BlockList from "./block-list.svelte";
  import LocalTimeBlock from "./local-time-block.svelte";

  const {
    useSelector,
    editContext: {
      handlers: { handleTaskMouseUp },
    },
    dispatch,
  } = getObsidianContext();

  const result = useSelector(selectLimitedSearchResult);
  const description = useSelector(selectSearchDescription);
  const query = useSelector(selectQuery);
</script>

<div class="search-wrapper">
  <input
    oninput={(event) => {
      dispatch(queryUpdated(event.currentTarget.value));
    }}
    placeholder="Search for tasks across the vault"
    spellcheck="false"
    type="text"
    value={$query}
  />

  <div class="result-message">
    {$description}
  </div>

  <BlockList list={$result}>
    {#snippet match(task: LocalTask)}
      <LocalTimeBlock
        --time-block-padding="var(--size-4-1)"
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
