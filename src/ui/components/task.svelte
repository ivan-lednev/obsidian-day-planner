<script lang="ts">
  import { getYCoords, zoomLevel } from "../../store/timeline-store";
  import { computeAutoHeight, doesContentOverflow } from "../../util/height";

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

  $: zIndex = hovered ? 1 : 0;
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
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;

    padding: 5px;

    font-size: var(--font-ui-medium);
    color: aliceblue;
    text-align: left;
    white-space: normal;

    background-color: var(--color-accent);
    border: 1px solid var(--background-modifier-border);
    border-radius: var(--radius-s);
    box-shadow: none;

    transition: height 0.2s ease-in-out;
  }
</style>
