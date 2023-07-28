<script lang="ts">
  import TimeScale from "./time-scale.svelte";
  import Pointer from "./pointer.svelte";
  import TaskContainer from "./task-container.svelte";

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const tasks = [
    { start: 60 * 10 + 30, duration: 50, title: "Polish class" },
    { start: 60 * 12, duration: 30, title: "Lunch" }
  ];
</script>

<div class="time-grid">
  <TimeScale {hours} />
  <div class="task-grid">
    <div class="moving-items">
      <Pointer />
      <TaskContainer {tasks} />
    </div>
    {#each hours as hour}
      <div class="time-grid-block"></div>
    {/each}
  </div>
</div>

<style>
  .moving-items {
    position: absolute;
    left: 0;
    right: 0;
  }

  .time-grid {
    display: flex;
  }

  .task-grid {
    position: relative;
    flex: 1 0 0;
  }

  .time-grid-block {
    height: 60px;
    border-bottom: 1px solid var(--background-modifier-border);
    border-left: 1px solid var(--background-modifier-border);
    flex-grow: 1;
  }
</style>
