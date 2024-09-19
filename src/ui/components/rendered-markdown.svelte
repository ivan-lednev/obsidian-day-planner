<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { settings } from "../../global-store/settings";
  import type { LocalTask } from "../../task-types";
  import type { ObsidianContext } from "../../types";
  import { renderTaskMarkdown } from "../actions/render-task-markdown";

  export let task: LocalTask;

  const { renderMarkdown, toggleCheckboxInFile } =
    getContext<ObsidianContext>(obsidianContext);
</script>

<div
  class="rendered-markdown"
  use:renderTaskMarkdown={{
    task,
    settings: $settings,
    renderMarkdown,
    toggleCheckboxInFile,
  }}
></div>

<style>
  :global(.day-planner-task-decoration) {
    margin: 0 0.25em;
    padding: 0.1em 0.25em;

    font-size: var(--tag-size);
    font-weight: var(--tag-weight);
    line-height: 1;
    color: var(--tag-color);
    text-decoration: var(--tag-decoration);

    background-color: var(--tag-background);
    border-radius: var(--radius-s);
  }

  .rendered-markdown {
    --checkbox-size: var(--font-ui-small);

    flex: 1 0 0;
    color: var(--text-normal);
  }

  .rendered-markdown :global(p),
  .rendered-markdown :global(ul) {
    margin-block: 0;
  }

  .rendered-markdown :global(ul),
  .rendered-markdown :global(ol) {
    padding-inline-start: 20px;
  }

  .rendered-markdown :global(input[type="checkbox"]) {
    top: 2px;
    margin-inline-end: 4px;
    border-color: var(--text-muted);
  }

  .rendered-markdown :global(li) {
    color: var(--text-normal);
  }

  .rendered-markdown :global(li.task-list-item[data-task="x"]),
  .rendered-markdown :global(li.task-list-item[data-task="X"]) {
    color: var(--text-muted);
  }
</style>
