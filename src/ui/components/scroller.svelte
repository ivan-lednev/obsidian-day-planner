<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
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

  const { isEditing } = getObsidianContext();

  const blockPanOnEdit: Attachment<HTMLElement> = (el) =>
    on(el, "touchmove", (event) => {
      if ($isEditing) {
        event.preventDefault();
      }
    });
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
    if (!$isEditing || !el) {
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
  {@attach blockPanOnEdit}
>
  {@render children(isUnderCursor)}
</div>

<style>
  .scroller {
    display: flex;
    background-color: var(--background-primary);
  }
</style>
