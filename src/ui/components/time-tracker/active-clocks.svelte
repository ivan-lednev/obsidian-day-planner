<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { sTaskToUnscheduledTask } from "../../../service/dataview-facade";
  import { ObsidianContext } from "../../../types";
  import { deleteProps } from "../../../util/properties";
  import Tree from "../obsidian/tree.svelte";
  import Task from "../task.svelte";

  import CancelClockButton from "./cancel-clock-button.svelte";
  import ClockOutButton from "./clock-out-button.svelte";

  const { activeClocks, clockOut, cancelClock } =
    getContext<ObsidianContext>(obsidianContext);

  // TODO: move out
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
        <ClockOutButton onClick={() => clockOut(task)} />
        <CancelClockButton onClick={() => cancelClock(task)} />
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
