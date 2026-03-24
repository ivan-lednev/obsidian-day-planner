<script lang="ts">
  import { currentTimeSignal } from "../../global-store/current-time";
  import { timeToTimelineOffset } from "../../global-store/derived-settings";
  import { settings } from "../../global-store/settings";
  import { getMinutesSinceMidnight } from "../../util/moment";

  type Props = {
    autoScrollBlocked?: boolean;
    showBall?: boolean;
  };

  const {
    autoScrollBlocked = false,
    showBall = true,
  }: Required<Props> = $props();

  let el: HTMLDivElement;
  const coords = $derived(
    timeToTimelineOffset(
      getMinutesSinceMidnight(currentTimeSignal.current),
      $settings,
    ),
  );

  function scrollIntoView() {
    if ($settings.centerNeedle && !autoScrollBlocked) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  $effect(() => {
    coords;
    scrollIntoView();
  });
</script>

<div
  bind:this={el}
  style:top="{coords}px"
  class="needle absolute-stretch-x"
></div>
{#if showBall}
  <div style:top="{coords}px" class="ball"></div>
{/if}

<style>
  .needle {
    height: 2px;
    background-color: var(--color-accent);
  }

  .ball {
    position: absolute;
    z-index: 1000;

    width: var(--size-4-1);
    height: 12px;
    margin-top: -5px;

    background: var(--color-accent);
    border-radius: var(--radius-s);
  }
</style>
