<script lang="ts">
  import { Play, Pause, Trash2 } from "lucide-svelte";
  import ControlButton from "../control-button.svelte";
</script>

<div class="container">
<!--  TODO: add "Editor clocks"-->
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

<style>
  .container {
    display: flex;
    margin: var(--size-4-2);
  }
</style>
