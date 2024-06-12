<script lang="ts">
  export let cursor: string | undefined = "";
  export let label: string;
</script>

<div
  aria-label={label}
  style:cursor
  class="grip clickable-icon"
  on:mousedown|stopPropagation
>
  <slot />
</div>

<style>
  /* todo: rename */
  .grip {
    color: var(--text-faint);
    display: flex;
  }

  .grip:hover {
    color: var(--text-muted);
  }
</style>
