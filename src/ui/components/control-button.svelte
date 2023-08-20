<script lang="ts">
  export let label: string;
  export let isActive = false;
  export let classes = "";
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="clickable-icon {classes}"
  class:is-active={isActive}
  aria-label={label}
  on:click
>
  <slot />
</div>

<style>
  .clickable-icon {
    flex-basis: var(--input-height);
    align-self: center;
    grid-column-start: var(--grid-column-start, auto);
    justify-self: var(--justify-self, auto);
    white-space: nowrap;
  }
</style>
