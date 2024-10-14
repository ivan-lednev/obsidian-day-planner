<script lang="ts">
  const {
    key,
    value,
    onpointerup = () => {},
  }: { key: string; value: string; onpointerup?: () => void } = $props();
</script>

{#if value}
  <span class="pill" {onpointerup}>{key}: {value}</span>
{/if}

<style>
  .pill {
    display: inline-flex;

    padding: var(--size-4-1) var(--size-4-2);

    font-size: var(--font-ui-smaller);
    color: var(--tag-color);
    white-space: nowrap;

    background-color: var(--tag-background);
    border-radius: var(--radius-m);
  }
</style>
