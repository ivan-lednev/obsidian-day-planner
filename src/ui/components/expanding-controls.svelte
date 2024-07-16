<script lang="ts">
  import { fade, slide } from "svelte/transition";

  import Hoverable from "./hoverable.svelte";

  export let reverse: boolean | undefined = false;
</script>

<Hoverable let:hovering>
  <div
    style:flex-direction={reverse ? "row-reverse" : "row"}
    style:touch-action="none"
    class="expanding-controls"
    on:pointermove|preventDefault
    transition:fade={{ duration: 200 }}
  >
    {#if hovering}
      <!--TODO: clean up styles-->
      <div
        style="display: flex"
        transition:slide={{ duration: 200, axis: "x" }}
      >
        <slot name="hidden" />
      </div>
    {/if}
    <slot name="visible" />
  </div>
</Hoverable>

<style>
  .expanding-controls {
    overflow: hidden;
    display: flex;
    flex-direction: var(--expanding-controls-flex-direction, row);

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
  }
</style>
