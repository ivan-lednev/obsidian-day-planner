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

<TaskGrid />

<style>
  .controls-container {
    margin: var(--size-4-2);
  }
</style>
