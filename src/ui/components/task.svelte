<script lang="ts">
  import { getYCoords, zoomLevel } from "../../timeline-store";
  import { computeAutoHeight, doesContentOverflow } from "../../util";

  export let text;
  export let startMinutes;
  export let durationMinutes;

  let el;
  let hovered = false;

  $: height =
    doesContentOverflow(el) && hovered
      ? computeAutoHeight(el)
      : `${durationMinutes * $zoomLevel}px`;
</script>

<div
  bind:this={el}
  class="task absolute-stretch-x"
  style:height
  style:transform="translateY({$getYCoords(startMinutes)}px)"
  on:mouseenter={() => {
    hovered = true;
  }}
  on:mouseleave={() => {
    hovered = false;
  }}
>
  {text}
</div>

<style>
  .task {
    padding: 5px;
    border-radius: var(--radius-s);
    font-size: var(--font-ui-medium);
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    box-shadow: none;
    color: aliceblue;
    background-color: var(--color-accent);
    border: 1px solid var(--background-modifier-border);
    white-space: normal;
    text-align: left;
    transition: height 0.2s ease-in-out;
  }
</style>
