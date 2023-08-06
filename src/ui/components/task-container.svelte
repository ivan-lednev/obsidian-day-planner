<script lang="ts">
  import { tasks } from "../../store/timeline-store";
  import Task from "./task.svelte";
</script>

<div class="task-container absolute-stretch-x">
  {#each $tasks as taskProps (taskProps.startMinutes)}
    <Task {...taskProps} />
  {/each}
</div>

<style>
  .task-container {
    display: flex;
    flex-direction: column;
    margin-right: 10px;
    margin-left: 20px;
  }
</style>
