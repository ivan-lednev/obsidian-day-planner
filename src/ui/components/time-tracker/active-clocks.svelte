<script lang="ts">
  import { Pause, Trash2 } from "lucide-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { ObsidianContext } from "../../../types";
  import ControlButton from "../control-button.svelte";
  import Tree from "../obsidian/tree.svelte";

  const { activeClocks, clockOut, cancelClock } =
    getContext<ObsidianContext>(obsidianContext);
</script>

<Tree title="Active clocks">
<!--  TODO: -> sTasksWithActiveClocks -->
  {#each $activeClocks as sTask}
    <div class="inner-container">
      <ControlButton label="Clock out" on:click={() => clockOut(sTask)}>
        <Pause class="svg-icon" />
      </ControlButton>
      <ControlButton label="Cancel clock" on:click={() => cancelClock(sTask)}>
        <Trash2 class="svg-icon" />
      </ControlButton>
      <div class="task-text">{sTask.text}</div>
    </div>
  {/each}
</Tree>

<style>
  /*   TODO: rename classes */
  .inner-container {
    display: flex;
  }

  .task-text {
    display: flex;
    align-items: center;
    margin-left: var(--size-4-2);
    font-size: var(--font-ui-small);
  }
</style>
