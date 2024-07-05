<script lang="ts">
  import { fade, slide } from "svelte/transition";

  import Hoverable from "./hoverable.svelte";
</script>

<Hoverable let:hovering>
  <div class="expanding-controls" transition:fade={{ duration: 200 }}>
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

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
  }
</style>
