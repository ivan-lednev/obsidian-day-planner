<script lang="ts">
  import { getContext } from "svelte";

  import { obsidianContext } from "../../../constants";
  import { sTaskToUnscheduledTask } from "../../../service/dataview-facade";
  import { ObsidianContext } from "../../../types";
  import Tree from "../obsidian/tree.svelte";
  import Task from "../task.svelte";

  import CancelClockButton from "./cancel-clock-button.svelte";
  import ClockOutButton from "./clock-out-button.svelte";

  const { sTasksWithActiveClockProps, clockOut, cancelClock } =
    getContext<ObsidianContext>(obsidianContext);
</script>

<Tree title="Active clocks">
  {#if $sTasksWithActiveClockProps.length === 0}
    <span class="message">No active clocks</span>
  {:else}
    <div class="active-clocks">
      {#each $sTasksWithActiveClockProps as sTask}
        <Task
          --task-background-color="var(--background-secondary)"
          task={sTaskToUnscheduledTask(sTask, window.moment())}
        >
          <div class="task-decorations">
            <ClockOutButton onClick={() => clockOut(sTask)} />
            <CancelClockButton onClick={() => cancelClock(sTask)} />
          </div>
        </Task>
      {/each}
    </div>
  {/if}
</Tree>

<style>
  .task-decorations {
    display: flex;
    gap: var(--size-4-1);
    align-items: center;
  }

  .task-decorations > :global(*) {
    flex: 1 0 0;
  }

  .active-clocks {
    margin-left: var(--size-4-3);
    padding: var(--size-4-1) 0 var(--size-4-1) var(--size-4-3);
    border-left: 1px solid var(--background-modifier-border);
  }

  .message {
    font-size: var(--font-ui-small);
    color: var(--text-faint);
  }

  .active-clocks :global(svg.svg-icon) {
    width: var(--icon-xs);
    height: var(--icon-xs);
  }
</style>
