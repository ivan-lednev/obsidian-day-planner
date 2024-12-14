<script lang="ts">
  import type { Snippet } from "svelte";
  import { slide } from "svelte/transition";

  import { isTouchEvent } from "../../util/util";

  interface Props {
    reverse?: boolean;
    initial: Snippet;
    expanded: Snippet;
  }

  export const { reverse = false, initial, expanded }: Props = $props();

  let isActive = $state(false);
</script>

<div
  style:flex-direction={reverse ? "row-reverse" : "row"}
  style:touch-action="none"
  class="expanding-controls"
  class:active={isActive}
  onpointerup={(event) => {
    if (isTouchEvent(event)) {
      isActive = !isActive;
    }
  }}
  onpointerenter={(event) => {
    if (isTouchEvent(event)) {
      return;
    }

    isActive = true;
  }}
  onpointerleave={(event) => {
    if (isTouchEvent(event)) {
      return;
    }

    isActive = false;
  }}
>
  <!--  TODO: remove hardcoded values-->
  {#if isActive}
    <div
      class="expanded-wrapper"
      transition:slide={{ duration: 200, axis: "x" }}
    >
      {@render expanded()}
    </div>
  {/if}
  {@render initial()}
</div>

<style>
  .expanded-wrapper,
  .expanding-controls {
    display: flex;
    gap: var(--size-2-1);
  }

  .expanding-controls {
    flex-direction: var(--expanding-controls-flex-direction, row);

    padding: var(--size-2-1);

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);

    /* todo: remove hardcoded values */

    border-radius: 4px;

    /* todo: remove hardcoded values */
    box-shadow: 2px 2px 4px 0 #0000001f;
  }
</style>
