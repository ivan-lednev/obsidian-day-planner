<script lang="ts">
  import Tree from "../obsidian/tree.svelte";
  import TaskGrid from "../task-grid.svelte";
  import TimelineControls from "../timeline-controls.svelte";

  import ActiveClocks from "./active-clocks.svelte";
  import EditorClocks from "./editor-clocks.svelte";
</script>

<Tree title="Editor clock controls">
  <EditorClocks />
</Tree>
<ActiveClocks />
<Tree --flex="1 0 0" title="Timeline">
  <TimelineControls />
  <TaskGrid readonly={true} />
</Tree>
