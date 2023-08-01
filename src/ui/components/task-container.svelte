<script lang="ts">
  import { getYCoords, zoomLevel } from "../../timeline-store";
  import { tasks } from "../../timeline-store";
</script>

<div class="task-container absolute-stretch-x">
  {#each $tasks as { text, startMinutes, durationMinutes }}
    <button
      class="task absolute-stretch-x"
      style:height="{durationMinutes * $zoomLevel}px"
      style:transform="translateY({$getYCoords(startMinutes)}px)"
      >{text}
    </button>
  {/each}
</div>

<style>
  .task-container {
    display: flex;
    margin-left: 20px;
    margin-right: 10px;
    flex-direction: column;
  }

  .task {
    font-size: var(--font-ui-medium);
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    box-shadow: none;
    color: aliceblue;
    background-color: var(--color-accent);
    border: 1px solid var(--background-modifier-border);
  }
</style>
