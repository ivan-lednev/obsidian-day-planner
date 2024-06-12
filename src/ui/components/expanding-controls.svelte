<script>
  import Hoverable from "./hoverable.svelte";
</script>

<Hoverable let:hovering>
  <div class="expanding-controls">
    {#if hovering}
      <slot name="hidden" />
    {/if}
    <slot name="visible" />
  </div>
</Hoverable>

<style>
  /*  TODO: add variables */
  .expanding-controls {
    gap: 2px;
    padding: 2px;

    border: 1px solid var(--background-modifier-border);
    background-color: var(--background-primary);
    border-radius: 4px;
    display: flex;

    position: absolute;
    z-index: 99;

    top: var(--top, initial);
    bottom: var(--bottom, initial);
    right: var(--right, initial);
  }
</style>
