<script lang="ts">
  import { Square, Trash2 } from "lucide-svelte";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { sTaskToUnscheduledTask } from "../../../service/dataview-facade";
  import { ObsidianContext } from "../../../types";
  import { deleteProps } from "../../../util/properties";
  import ControlButton from "../control-button.svelte";
  import Tree from "../obsidian/tree.svelte";
  import Task from "../task.svelte";

  const { activeClocks, clockOut, cancelClock } =
    getContext<ObsidianContext>(obsidianContext);

  $: formattedTasks = $activeClocks.map((sTask) => {
    return sTaskToUnscheduledTask(
      { ...sTask, text: deleteProps(sTask.text) },
      window.moment(),
    );
  });
</script>

<Tree title="Active clocks">
  <!--  TODO: -> sTasksWithActiveClocks -->
  {#each formattedTasks as task}
    <Task {task}>
      <div class="buttons">
        <!--        TODO: introduce separate components -->
        <ControlButton label="Clock out" on:click={() => clockOut(task)}>
          <Square class="svg-icon" />
        </ControlButton>
        <ControlButton label="Cancel clock" on:click={() => cancelClock(task)}>
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
