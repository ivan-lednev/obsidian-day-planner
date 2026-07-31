<script lang="ts">
  import type { Snippet } from "svelte";

  import { currentTimeSignal } from "../../global-store/current-time";
  import { momentToTimelineOffset } from "../../global-store/derived-settings";
  import { settingsStore } from "../../global-store/settings";

  interface Props {
    autoScrollBlocked?: boolean;
    controls?: Snippet;
  }

  const { autoScrollBlocked = false, controls }: Props = $props();

  let el: HTMLDivElement;
  const coords = $derived(
    momentToTimelineOffset(currentTimeSignal.current, $settingsStore),
  );

  function scrollIntoView() {
    if ($settingsStore.centerNeedle && !autoScrollBlocked) {
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    coords;
    scrollIntoView();
  });
</script>

<div bind:this={el} style:top="{coords}px" class="needle absolute-stretch-x">
  {@render controls?.()}
</div>

<style>
  .needle {
    /* Controls opt back in; the line itself must not swallow clicks on blocks */
    pointer-events: none;
    height: 2px;
    background-color: var(--color-accent);
  }
</style>
