<script lang="ts">
  export let cursor: string | undefined = "";
  export let label: string;
</script>

<div style:cursor class="clickable-icon" aria-label={label} on:pointerdown>
  <slot />
</div>

<style>
  .clickable-icon {
    padding: var(--size-2-2) var(--size-4-2);
    border-radius: 0;
  }
</style>
