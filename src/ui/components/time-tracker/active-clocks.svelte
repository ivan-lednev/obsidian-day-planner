<script lang="ts">
  import { Play, Pause, Trash2 } from "lucide-svelte";
  import ControlButton from "../control-button.svelte";
</script>

<!--TODO: rename classes-->
<div class="container">
  <!--  TODO: add collapse icon-->
<!--  TODO: add collapsing-->
  <!--  TODO: Move this header to a separate component?-->
  <div class="tree-item-self is-clickable">
    <div class="tree-item-inner">Active clocks</div>
  </div>
  <div class="inner-container">
    <ControlButton isActive={false} label="Clock out" on:click={() => {}}>
      <Pause class="svg-icon" />
    </ControlButton>
    <ControlButton isActive={false} label="Cancel clock" on:click={() => {}}>
      <Trash2 class="svg-icon" />
    </ControlButton>
    <div class="task-text">Water the cat</div>
  </div>

  <div class="inner-container">
    <ControlButton isActive={false} label="Clock out" on:click={() => {}}>
      <Pause class="svg-icon" />
    </ControlButton>
    <ControlButton isActive={false} label="Cancel clock" on:click={() => {}}>
      <Trash2 class="svg-icon" />
    </ControlButton>
    <div class="task-text">Water the cat</div>
  </div>
</div>

<style>
  .container {
    margin: var(--size-4-2);
  }

  .inner-container {
    display: flex;
  }

  .task-text {
    display: flex;
    align-items: center;
    margin: var(--size-4-2);
  }

  .tree-item-inner {
    font-weight: var(--font-medium);
  }
</style>
