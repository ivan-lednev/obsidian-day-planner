<script lang="ts">
  export let key: string;
  export let value: string;
</script>

{#if value}
  <span class="pill">{key}: {value}</span>
{/if}

<style>
  .pill {
    display: inline-flex;

    padding: var(--size-2-1) var(--size-4-1);

    font-size: var(--font-ui-smaller);
    color: var(--color-accent);
    white-space: nowrap;

    border: 1px solid var(--color-accent);
    border-radius: var(--radius-m);
  }
</style>
