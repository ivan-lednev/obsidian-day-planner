<script lang="ts">
  import type { LocalTask } from "../../task-types";
  import { hoverPreview } from "../actions/hover-preview";

  export let task: LocalTask;
</script>

<div class="markdown-block-content" use:hoverPreview={task}>
  <slot />
</div>

<style>
  .markdown-block-content {
    overflow: hidden;
    display: flex;
    flex: 1 0 0;
    padding: var(--size-2-1) var(--size-4-1);
  }
</style>
