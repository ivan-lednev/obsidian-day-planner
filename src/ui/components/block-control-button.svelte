<script lang="ts">
  export let cursor: string | undefined = "";
  export let label: string;
</script>

<div
  style:cursor
  class="clickable-icon"
  aria-label={label}
  on:mousedown|stopPropagation
>
  <slot />
</div>

<style>
  .clickable-icon {
    padding: var(--size-2-1) var(--size-2-2);
  }
</style>
