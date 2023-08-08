<script lang="ts">
  import type { PlanItem } from "src/plan-item";
  import Task from "./task.svelte";

  export let tasks: PlanItem[] = [];

  let pointerYCoords: number;
  let el: HTMLDivElement;
</script>

<div
  bind:this={el}
  class="task-container absolute-stretch-x"
  on:mousemove={(event) => {
    pointerYCoords = event.clientY - el.getBoundingClientRect().top;
  }}
>
  {#each tasks as taskProps (taskProps.startMinutes)}
    <Task {...taskProps} {pointerYCoords} />
  {/each}
</div>

<style>
  .task-container {
    top: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    margin-right: 10px;
    margin-left: 20px;
  }
</style>
