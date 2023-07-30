<script lang="ts">
  import TimeScale from "./time-scale.svelte";
  import Needle from "./needle.svelte";
  import TaskContainer from "./task-container.svelte";
  import { hourSize, planSummary, startHour } from "../../timeline-store";

  $: allHours = Array.from({ length: 24 })
    .map((value, index) => index)
    .slice($startHour);

  $: console.log($planSummary);

  // todo: remove
  const tasks = [
    { start: 60 * 10 + 30, duration: 50, title: "Polish class" },
    { start: 60 * 12, duration: 30, title: "Lunch" }
  ];
</script>

<div class="time-grid">
  <TimeScale visibleHours={allHours} />
  <div class="task-grid">
    <div class="moving-items">
      <Needle />
      <TaskContainer />
    </div>
    {#each allHours as hour}
      <div class="time-grid-block" style:height="{$hourSize}px"></div>
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
    border-bottom: 1px solid var(--background-modifier-border);
    border-left: 1px solid var(--background-modifier-border);
    flex-grow: 1;
  }
</style>
