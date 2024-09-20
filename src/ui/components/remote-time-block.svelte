<script lang="ts">
  import type { RemoteTask, WithPlacing, WithTime } from "../../task-types";

  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: WithPlacing<WithTime<RemoteTask>>;
  const isTentative = task.rsvpStatus === "TENTATIVE";
  const isDeclined = task.rsvpStatus === "DECLINED";
</script>

<ScheduledTimeBlock {task}>
  <div class="remote-task-content">
    <div
      style="

--ribbon-color: {task.calendar.color};"
      class="ribbon"
      class:declined={isDeclined}
      class:tentative={isTentative}
    />
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

    background-color: var(--ribbon-color);
  }

  .ribbon.declined {
    background-color: inherit;
    border: 1.5px solid var(--ribbon-color);
  }

  .ribbon.tentative::before {
    content: "";

    position: absolute;
    z-index: 1;
    inset: 0;

    background-image: repeating-linear-gradient(
      45deg,
      rgb(255 255 255 / 80%),
      rgb(255 255 255 / 80%) 5px,
      transparent 5px,
      transparent 10px
    );
  }
</style>
