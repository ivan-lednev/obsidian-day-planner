<script lang="ts">
  import type { RemoteTask, WithPlacing, WithTime } from "../../task-types";

  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: WithPlacing<WithTime<RemoteTask>>;
</script>

<ScheduledTimeBlock {task}>
  <div class="remote-task-content">
    <div style:background-color={task.calendar.color} class="ribbon" />
    <div class="text">
      <span class="calendar-name">
        {task.calendar.name}
      </span>
      <span class="summary">
        {task.summary}
      </span>
    </div>
  </div>
</ScheduledTimeBlock>

<style>
  .calendar-name {
    color: var(--text-muted);
  }

  .remote-task-content {
    overflow: hidden;
    display: flex;
    flex: 1 0 0;
    flex-direction: column;

    padding: var(--size-2-1) var(--size-4-1);
    padding-left: calc(4px + var(--size-4-2));

    color: var(--text-normal);
  }

  .ribbon {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;

    width: var(--size-4-2);
  }
</style>
