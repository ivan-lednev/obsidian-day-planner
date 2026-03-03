<script lang="ts">
  import { capitalize } from "lodash/fp";
  import { type Snippet } from "svelte";

  import { AlertTriangle, Zap } from "./lucide";
  import { Info } from "./lucide";

  type CalloutType = "error" | "warning" | "info";

  const {
    children,
    type = "info",
    title = capitalize(type),
  }: {
    children: Snippet;
    title?: string;
    type?: "error" | "warning" | "info";
  } = $props();

  const colors: Record<CalloutType, string> = {
    error: "var(--callout-error)",
    warning: "var(--callout-warning)",
    info: "var(--callout-default)",
  };

  const color = $derived(colors[type]);
</script>

<div style:--callout-color={color} class="callout-wrapper">
  <div class="callout-title">
    {#if type === "error"}
      <Zap class="planner-callout-icon" />
    {:else if type === "warning"}
      <AlertTriangle />
    {:else}
      <Info />
    {/if}
    <span class="callout-title-text">{title}</span>
  </div>
  <div class="callout-content">
    {@render children()}
  </div>
</div>

<style>
  .callout-wrapper :global(.planner-callout-icon) {
    color: rgb(var(--callout-color));
  }

  .callout-wrapper {
    --callout-opacity: 0.1;

    display: flex;
    flex-direction: column;
    gap: var(--size-4-2);

    padding: var(--size-4-2);

    background-color: rgba(var(--callout-color), var(--callout-opacity));
    border-radius: var(--radius-s);
  }

  .callout-wrapper :global(.svg-icon) {
    flex-shrink: 0;
  }

  .callout-title {
    display: flex;
    gap: var(--size-4-1);
    color: rgb(var(--callout-color));
  }

  .callout-title-text {
    font-weight: var(--callout-title-weight);
  }
</style>
