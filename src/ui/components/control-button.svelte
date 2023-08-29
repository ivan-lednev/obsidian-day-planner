<script lang="ts">
  export let label: string;
  export let isActive = false;
  export let disabled = false;
  export let classes = "";
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="clickable-icon {classes}"
  class:is-active={isActive}
  aria-disabled={disabled}
  aria-label={label}
  on:click
>
  <slot />
</div>

<style>
  .clickable-icon {
    grid-column-start: var(--grid-column-start, auto);
    flex-basis: var(--input-height);
    align-self: center;
    justify-self: var(--justify-self, auto);

    color: var(--color, var(--icon-color));
    white-space: nowrap;
  }
</style>
