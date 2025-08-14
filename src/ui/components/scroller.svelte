<script lang="ts">
  import type { Snippet } from "svelte";
  import { on } from "svelte/events";

  import { getObsidianContext } from "../../context/obsidian-context";

  const {
    children,
    onscroll,
    ...rest
  }: {
    children: Snippet<[boolean]>;
    class?: string;
    onscroll?: (event: Event) => void;
  } = $props();

  let isUnderCursor = $state(false);

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
  class={["scroller", rest.class]}
  onmouseenter={() => {
    isUnderCursor = true;
  }}
  onmouseleave={() => {
    isUnderCursor = false;
  }}
  {onscroll}
  use:blockPanOnEdit
>
  {@render children(isUnderCursor)}
</div>

<style>
  .scroller {
    overflow: auto;
    display: flex;
    flex: 1 0 0;
    background-color: var(--background-secondary);
  }
</style>
