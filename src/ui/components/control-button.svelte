<script lang="ts">
  import { LoaderCircle } from "lucide-svelte";
  import { type Snippet } from "svelte";

  const {
    label = "",
    isActive = false,
    disabled = false,
    classes,
    onclick,
    icon,
    children,
    ...rest
  }: {
    label?: string;
    class?: object | string;
    isActive?: boolean;
    disabled?: boolean;
    classes?: string;
    onclick: (event: MouseEvent) => void | Promise<void>;
    icon?: Snippet;
    children?: Snippet;
  } = $props();

  let isPending = $state(false);
</script>

<div
  class={["clickable-icon", classes, rest.class, { "is-active": isActive }]}
  aria-disabled={disabled}
  aria-label={label}
  onclick={async (event: MouseEvent) => {
    try {
      isPending = true;

      await onclick(event);
    } finally {
      isPending = false;
    }
  }}
>
  {#if isPending}
    <LoaderCircle class="is-spinning svg-icon" />
  {:else}
    {@render icon?.()}
  {/if}
  {@render children?.()}
</div>

<style>
  .clickable-icon {
    display: flex;
    gap: var(--size-2-1);

    color: var(--color, var(--icon-color));
    white-space: nowrap;

    border: var(--control-button-border, none);
    border-radius: var(--border-radius, var(--radius-s));
  }

  :global(.is-spinning) {
    animation: spin 1.5s infinite linear;
  }
</style>
