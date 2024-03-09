<script lang="ts">
  import { UnscheduledTask } from "../../types";
  import { hoverPreview } from "../actions/hover-preview";

  export let task: UnscheduledTask
</script>

<div class="markdown-block-content" use:hoverPreview={task}>
  <slot />
</div>

<style>
  .markdown-block-content {
    display: flex;
    flex: 1 0 0;
    padding: 4px 6px 6px;
  }
</style>
