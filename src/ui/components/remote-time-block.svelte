<script lang="ts">
  import { Task } from "../../types";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: Task;

  // Determine if the task is tentative or declined
  const isTentative = task.rsvpStatus === "TENTATIVE";
  const isDeclined = task.rsvpStatus === "DECLINED";
</script>

<ScheduledTimeBlock {task}>
  <div
    class="remote-task-content"
    class:striped={isTentative}
    class:crosshatched={isDeclined}
  >
    <div
      class="ribbon"
      style:background-color={task.calendar.color}
    />
    <div class="text">
      <span class="calendar-name">
        {task.calendar.name}
      </span>
      <span class="summary">
        {task.text}
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
    position: relative;

    padding: var(--size-2-1) var(--size-4-1);
    padding-left: calc(4px + var(--size-4-2));

    color: var(--text-normal);
    background-color: white; /* Default background color */
  }

  .ribbon {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: var(--size-4-2);
    background-size: 10px 10px;
  }

  /* Striped pattern for tentative status */
  .striped {
    background-image: repeating-linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.05),
      rgba(0, 0, 0, 0.05) 5px,
      rgba(255, 255, 255, 0) 5px,
      rgba(255, 255, 255, 0) 10px
    );
  }

  /* Crosshatched pattern for declined status */
  .crosshatched {
    background-image: 
      repeating-linear-gradient(
        45deg,
        rgba(0, 0, 0, 0.05),
        rgba(0, 0, 0, 0.05) 5px,
        rgba(255, 255, 255, 0) 5px,
        rgba(255, 255, 255, 0) 10px
      ),
      repeating-linear-gradient(
        -45deg,
        rgba(0, 0, 0, 0.05),
        rgba(0, 0, 0, 0.05) 5px,
        rgba(255, 255, 255, 0) 5px,
        rgba(255, 255, 255, 0) 10px
      );
  }

  .text {
    padding-left: var(--size-4-2);
    z-index: 1;
  }
</style>
