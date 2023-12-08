<script lang="ts">
  import { Play, Pause, Trash2 } from "lucide-svelte";

  import ControlButton from "../control-button.svelte";
  import Tree from "../obsidian/tree.svelte";
</script>

<Tree title="Editor clocks">
  <div class="buttons">
    <ControlButton
      isActive={false}
      label="Clock in (no task under cursor)"
      on:click={() => {}}
    >
      <Play class="svg-icon" />
    </ControlButton>
    <ControlButton isActive={false} label="Clock out" on:click={() => {}}>
      <Pause class="svg-icon" />
    </ControlButton>
    <ControlButton isActive={false} label="Cancel clock" on:click={() => {}}>
      <Trash2 class="svg-icon" />
    </ControlButton>
  </div>
</Tree>

<style>
  .buttons {
    display: flex;
  }
</style>
