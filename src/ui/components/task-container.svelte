<script>
  export let tasks;

  const startHour = 8;
</script>

<div class="task-container">
  {#each tasks as { title, start, duration }}
    <button
      class="task"
      style:height="{duration}px"
      style:transform="translateY(calc({start - startHour * 60}px))"
      >{title}
    </button>
  {/each}
</div>

<style>
  .task-container {
    display: flex;
    margin-left: 10px;
    margin-right: 10px;
    flex-direction: column;
  }

  .task {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
  }
</style>
