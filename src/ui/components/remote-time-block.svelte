<script lang="ts">
  import { Task } from "../../types";

  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: Task;

  // Determine if the task is tentative
  const isTentative = task.rsvpStatus === "TENTATIVE";
</script>

<ScheduledTimeBlock {task}>
  <div
    class="remote-task-content"
    class:striped={isTentative}
  >
    <div
      style:background-color={task.calendar.color}
      class="ribbon"
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
    position: relative;

    overflow: hidden;
    display: flex;
    flex: 1 0 0;
    flex-direction: column;

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

  .striped {
    background-image: repeating-linear-gradient(
      45deg,
      rgb(0 0 0 / 5%),
      rgb(0 0 0 / 5%) 5px,
      rgb(255 255 255 / 0%) 5px,
      rgb(255 255 255 / 0%) 10px
    );
  }

  .text {
    z-index: 1;
    padding-left: var(--size-4-2);
  }
</style>
