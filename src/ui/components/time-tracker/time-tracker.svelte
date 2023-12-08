<script lang="ts">
  import Tree from "../obsidian/tree.svelte";
  import TimelineControls from "../timeline-controls.svelte";
  import Timeline from "../timeline.svelte";

  import ActiveClocks from "./active-clocks.svelte";
  import EditorClockControls from "./editor-clock-controls.svelte";
</script>

<Tree title="Editor clock controls">
  <EditorClockControls />
</Tree>
<ActiveClocks />
<Tree --flex="1 0 0" title="Timeline">
  <TimelineControls />
  <Timeline readonly={true} />
</Tree>
