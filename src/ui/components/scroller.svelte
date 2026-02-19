<script lang="ts">
  import type { Snippet } from "svelte";
  import { on } from "svelte/events";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { createAutoScroll, getScrollZones } from "../../util/dom";

  const {
    children,
    onscroll,
    ...rest
  }: {
    children: Snippet<[boolean]>;
    class?: string | string[];
    onscroll?: (event: Event) => void;
  } = $props();

  let isUnderCursor = $state(false);
  let el: HTMLElement | undefined = $state();

  const { startScroll, stopScroll } = createAutoScroll();

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  function blockPanOnEdit(el: HTMLElement) {
    const off = on(el, "touchmove", (event) => {
      if ($editOperation) {
        event.preventDefault();
      }
    });

    return {
      destroy() {
        off();
      },
    };
  }
</script>

<div
  bind:this={el}
  class={["scroller", rest.class]}
  onmouseenter={() => {
    isUnderCursor = true;
  }}
  onmouseleave={() => {
    isUnderCursor = false;
  }}
  onpointerleave={stopScroll}
  onpointermove={(event) => {
    if (!$editOperation || !el) {
      return;
    }

    const scrollZones = getScrollZones(event, el);

    if (scrollZones.isInTopScrollZone) {
      startScroll({ el, direction: "up" });
    } else if (scrollZones.isInBottomScrollZone) {
      startScroll({ el, direction: "down" });
    } else {
      stopScroll();
    }
  }}
  {onscroll}
  use:blockPanOnEdit
>
  {@render children(isUnderCursor)}
</div>

<style>
  .scroller {
    display: flex;
    background-color: var(--background-secondary);
  }
</style>
