<script lang="ts">
  import { Lock } from "lucide-svelte";

  import { Task } from "../../types";

  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: Task;
</script>

<ScheduledTimeBlock {task}>
  <div class="remote-task-content">
    <div class="calendar">
      <Lock class="svg-icon lock-icon" />
      {task.calendar}
    </div>
    {task.text}
  </div>
</ScheduledTimeBlock>

<style>
  .calendar {
    display: flex;
    gap: var(--size-4-1);
    align-items: center;

    font-size: var(--font-ui-smaller);
    color: var(--text-muted);
  }

  .remote-task-content {
    display: flex;
    flex: 1 0 0;
    flex-direction: column;

    padding: 4px 6px 6px;
    padding-left: calc(4px + var(--size-4-2));
  }

  .remote-task-content::before {
    content: " ";

    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;

    width: var(--size-4-2);

    background: repeating-linear-gradient(
      45deg,
      var(--background-secondary),
      var(--background-secondary) 5px,
      var(--color-accent) 5px,
      var(--color-accent) 10px
    );
  }
</style>
