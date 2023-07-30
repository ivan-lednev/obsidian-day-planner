<script lang="ts">
  import { onMount } from "svelte";
  import { getCoords } from "../../timeline-store";
  import { getMinutesSinceMidnight } from "../../time-utils";

  const needleUpdateIntervalMillis = 5 * 1000;

  function getCoordsForNow() {
    return getCoords(getMinutesSinceMidnight());
  }

  let coords = getCoordsForNow();

  onMount(() => {
    const interval = setInterval(() => {
      coords = getCoordsForNow();
    }, needleUpdateIntervalMillis);

    return () => clearInterval(interval);
  });
</script>

<div class="needle" style:transform="translateY({coords}px)">
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
