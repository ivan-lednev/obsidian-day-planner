<script lang="ts">
  import { tasks } from "../../timeline-store";
  import Task from "./task.svelte";
</script>

<div class="task-container absolute-stretch-x">
  {#each $tasks as taskProps}
    <Task {...taskProps} />
  {/each}
</div>

<style>
  .task-container {
    display: flex;
    margin-left: 20px;
    margin-right: 10px;
    flex-direction: column;
  }
</style>
