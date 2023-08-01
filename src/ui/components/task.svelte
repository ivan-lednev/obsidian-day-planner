<script lang="ts">
  import { getYCoords, zoomLevel } from "../../timeline-store";
  import { computeAutoHeight, doesContentOverflow } from "../../util";

  export let text;
  export let startMinutes;
  export let durationMinutes;

  let el;
  let hovered = false;

  function handleMouseEnter() {
    hovered = true;
  }

  function handleMouseLeave() {
    hovered = false;
  }

  $: zIndex = hovered ? 2 : 1;
  $: height =
    doesContentOverflow(el) && hovered
      ? computeAutoHeight(el)
      : `${durationMinutes * $zoomLevel}px`;

  $: yCoords = $getYCoords(startMinutes);
  $: transform = `translateY(${yCoords}px)`;
</script>

<div
  bind:this={el}
  class="task absolute-stretch-x"
  style:height
  style:transform
  style:z-index={zIndex}
  on:mouseenter={handleMouseEnter}
  on:mouseleave={handleMouseLeave}
>
  {text}
</div>

<style>
  .task {
    overflow: hidden;
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
