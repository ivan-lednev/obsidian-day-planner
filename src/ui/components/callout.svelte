<script lang="ts">
  import { type Snippet } from "svelte";

  import { AlertTriangle, Zap } from "./lucide";
  import { Info } from "./lucide";

  type CalloutType = "error" | "warning" | "info";

  const {
    children,
    type = "info",
  }: { children: Snippet; type?: "error" | "warning" | "info" } = $props();

  const colors: Record<CalloutType, string> = {
    error: "var(--callout-error)",
    warning: "var(--callout-warning)",
    info: "var(--callout-default)",
  };

  const color = $derived(colors[type]);
</script>

<div style:--callout-color={color} class="callout-wrapper">
  {#if type === "error"}
    <Zap class="planner-callout-icon" />
  {:else if type === "warning"}
    <AlertTriangle />
  {:else}
    <Info />
  {/if}
  {@render children()}
</div>

<style>
  .callout-wrapper :global(.planner-callout-icon) {
    color: rgb(var(--callout-color));
  }

  .callout-wrapper {
    --callout-opacity: 0.1;

    display: flex;
    gap: var(--size-4-1);

    margin-inline: var(--callout-margin-inline);
    padding: var(--size-4-2);

    color: rgb(var(--callout-color));

    background-color: rgba(var(--callout-color), var(--callout-opacity));
    border-radius: var(--radius-s);
  }

  .callout-wrapper :global(.svg-icon) {
    flex-shrink: 0;
  }
</style>
