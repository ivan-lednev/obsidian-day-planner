<script lang="ts">
  import { Play, Pause, Trash2 } from "lucide-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { ObsidianContext } from "../../../types";
  import ControlButton from "../control-button.svelte";
  import Tree from "../obsidian/tree.svelte";

  const { clockInUnderCursor, clockOutUnderCursor, cancelClockUnderCursor } =
    getContext<ObsidianContext>(obsidianContext);
</script>

<Tree title="Editor clocks">
  <div class="buttons">
    <ControlButton label="Clock in" on:click={clockInUnderCursor}>
      <Play class="svg-icon" />
    </ControlButton>
    <ControlButton label="Clock out" on:click={clockOutUnderCursor}>
      <Pause class="svg-icon" />
    </ControlButton>
    <ControlButton label="Cancel clock" on:click={cancelClockUnderCursor}>
      <Trash2 class="svg-icon" />
    </ControlButton>
  </div>
</Tree>

<style>
  .buttons {
    display: flex;
  }
</style>
