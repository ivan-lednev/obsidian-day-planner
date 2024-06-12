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
    position: absolute;
    z-index: 99;
    top: var(--top, initial);
    right: var(--right, initial);
    bottom: var(--bottom, initial);

    display: flex;
    gap: 2px;

    padding: 2px;

    background-color: var(--background-primary);
    border: 1px solid var(--background-modifier-border);
    border-radius: 4px;
  }
</style>
