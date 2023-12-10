<script lang="ts">
  import { Pause, Trash2 } from "lucide-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { ObsidianContext } from "../../../types";
  import ControlButton from "../control-button.svelte";
  import Tree from "../obsidian/tree.svelte";
  import Task from "../task.svelte";
  import { sTaskToUnscheduledTask } from "../../../service/dataview-facade";

  const { activeClocks, clockOut, cancelClock } =
    getContext<ObsidianContext>(obsidianContext);
</script>

<Tree title="Active clocks">
  <!--  TODO: -> sTasksWithActiveClocks -->
  {#each $activeClocks as sTask}
    <Task task={sTaskToUnscheduledTask(sTask, window.moment())}>
      <div class="buttons">
        <ControlButton label="Clock out" on:click={() => clockOut(sTask)}>
          <Pause class="svg-icon" />
        </ControlButton>
        <ControlButton label="Cancel clock" on:click={() => cancelClock(sTask)}>
          <Trash2 class="svg-icon" />
        </ControlButton>
      </div>
    </Task>
  {/each}
</Tree>

<style>
  .buttons {
    display: flex;
    flex-direction: column;
  }
</style>
