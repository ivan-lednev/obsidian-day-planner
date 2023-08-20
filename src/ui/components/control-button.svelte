<script lang="ts">
  export let label: string;
  export let isActive = false;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  aria-label={label}
  class="clickable-icon"
  class:is-active={isActive}
  on:click
>
  <slot />
</div>

<style>
  .clickable-icon {
    flex-basis: var(--input-height);
    align-self: center;
  }
</style>
