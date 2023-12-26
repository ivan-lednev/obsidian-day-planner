<script lang="ts">
  import { Play } from "lucide-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { ObsidianContext } from "../../../types";
  import ControlButton from "../control-button.svelte";
  import Tree from "../obsidian/tree.svelte";

  import CancelClockButton from "./cancel-clock-button.svelte";
  import ClockOutButton from "./clock-out-button.svelte";

  const { clockInUnderCursor, clockOutUnderCursor, cancelClockUnderCursor } =
    getContext<ObsidianContext>(obsidianContext);
</script>

<Tree title="Editor clock controls">
  <div class="buttons">
    <ControlButton label="Clock in" on:click={clockInUnderCursor}>
      <Play class="svg-icon" />
    </ControlButton>
    <ClockOutButton onClick={clockOutUnderCursor} />
    <CancelClockButton onClick={cancelClockUnderCursor} />
  </div>
</Tree>

<style>
  .buttons {
    display: flex;
  }

  .buttons > :global(*) {
    flex: 1 0 0;
  }
</style>
