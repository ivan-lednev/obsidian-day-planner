<script lang="ts">
  import type { RemoteTask, WithPlacing, WithTime } from "../../task-types";

  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: WithPlacing<WithTime<RemoteTask>>;

  const tentative = task.rsvpStatus === "TENTATIVE";
  const declined = task.rsvpStatus === "DECLINED";
</script>

<ScheduledTimeBlock {task}>
  <div class="remote-task-content">
    <div
      style="

--ribbon-color: {task.calendar.color}"
      class="ribbon"
      class:declined
      class:tentative
    ></div>
    <div class="text">
      <span class="calendar-name">
        {task.calendar.name}
      </span>
      <span class="summary" class:declined>
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

    background-color: var(--ribbon-color);
  }

  .declined {
    background-color: inherit;
    border-right: 2px solid var(--ribbon-color);
  }

  .ribbon.tentative {
    background: repeating-linear-gradient(
      45deg,
      var(--ribbon-color),
      var(--ribbon-color) 5px,
      transparent 5px,
      transparent 10px
    );
    border-right: 1px solid var(--ribbon-color);
  }

  .summary.declined {
    color: var(--text-muted);
    text-decoration: line-through;
  }
</style>
