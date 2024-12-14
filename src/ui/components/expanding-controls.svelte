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
  style:touch-action="none"
  class="expanding-controls"
  class:active={isActive}
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
  onpointerup={(event) => {
    if (isTouchEvent(event)) {
      isActive = !isActive;
    }
  }}
>
  <!--  TODO: remove hardcoded values-->
  {#if reverse}
    {@render initial()}
  {/if}
  {#if isActive}
    <div
      class="expanded-wrapper"
      transition:slide={{ duration: 200, axis: "x" }}
    >
      {@render expanded()}
    </div>
  {/if}
  {#if !reverse}
    {@render initial()}
  {/if}
</div>

<style>
  .expanded-wrapper,
  .expanding-controls {
    display: flex;
    gap: var(--size-2-1);
  }

  .expanding-controls {
    padding: var(--size-2-1);

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);

    /* todo: remove hardcoded values */

    border-radius: 4px;

    /* todo: remove hardcoded values */
    box-shadow: 2px 2px 4px 0 #0000001f;
  }
</style>
