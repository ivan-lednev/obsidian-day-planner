<script lang="ts">
  import { onMount } from "svelte";
  import { zoomLevel } from "../../timeline-store";

  // todo: clean up, move moment code into module
  function positionFromTime(time: Date) {
    return window.moment
      .duration(window.moment(time).format("HH:mm"))
      .asMinutes();
  }

  let nowInMinutes = positionFromTime(window.moment());

  onMount(() => {
    const interval = setInterval(() => {
      nowInMinutes = positionFromTime(window.moment());
    }, 60 * 1000);

    return () => clearInterval(interval);
  });
</script>

<div class="needle" style:transform="translateY({nowInMinutes * $zoomLevel}px)">
  <div class="bullet"></div>
</div>

<style>
  .needle {
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--color-accent);
  }

  .bullet {
    position: absolute;
    left: -4px;
    top: -4px;
    border-radius: 50%;
    border: 5px solid var(--color-accent);
  }
</style>
