<script lang="ts">
  import TaskGrid from "../task-grid.svelte";
  import TimelineControls from "../timeline-controls.svelte";

  import ActiveClocks from "./active-clocks.svelte";
  import EditorClocks from "./editor-clocks.svelte";
</script>

<div class="controls-container">
  <EditorClocks />
  <ActiveClocks />
</div>

<!--TODO: align padding with the upper one-->
<TimelineControls />

<TaskGrid readonly={true} />

<style>
  .controls-container {
    padding: var(--size-4-2);
    border-bottom: 1px solid var(--background-modifier-border);
  }
</style>
