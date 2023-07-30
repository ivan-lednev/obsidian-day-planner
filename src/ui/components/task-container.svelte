<script>
  import { getCoords, zoomLevel } from "../../timeline-store";
  import { tasks } from "../../timeline-store";
</script>

<div class="task-container">
  {#each $tasks as { text, startMinutes, durationMinutes }}
    <!-- TODO: is might not be reactive -->
    <button
      class="task"
      style:height="{durationMinutes * $zoomLevel}px"
      style:transform="translateY({getCoords(startMinutes)}px)"
    >{text}
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
