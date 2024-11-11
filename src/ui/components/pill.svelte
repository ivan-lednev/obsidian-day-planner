<script lang="ts">
  const {
    key,
    value,
    onpointerup = () => {},
  }: {
    // todo: once lucide-svelte supports Svelte 5, remove this
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    key: any;
    value: string;
    onpointerup?: () => void;
  } = $props();
</script>

{#if value}
  <span class="pill" {onpointerup}>
    {#if typeof key === "string"}
      {key}:
    {:else}
      {@const Component = key}

      <Component class="pill-icon" />
    {/if}
    {value}
  </span>
{/if}

<style>
  :global(.pill-icon) {
    width: var(--size-4-3);
    height: var(--size-4-3);
  }

  .pill {
    display: inline-flex;
    gap: var(--size-4-1);
    align-items: center;

    padding: var(--size-2-1) var(--size-4-2);

    font-size: var(--font-ui-smaller);
    color: var(--tag-color);
    white-space: nowrap;

    background-color: var(--tag-background);
    border-radius: var(--radius-m);
  }
</style>
