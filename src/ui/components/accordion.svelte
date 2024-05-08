<script lang="ts">
  import { ChevronDown, ChevronRight } from "lucide-svelte";
  import ButtonWithIcon from "./button-with-icon.svelte";

  export let title: string;
  export let status: string | undefined = undefined;

  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
  }
</script>

<div class="accordion">
  <ButtonWithIcon on:click={toggle}>
    {#if isOpen}
      <ChevronDown class="svg-icon" />
    {:else}
      <ChevronRight class="svg-icon" />
    {/if}
    {title}
    {#if status}
      <span class="status">{status}</span>
    {/if}
  </ButtonWithIcon>
  {#if isOpen}
    <div class="accordion-contents">
      <slot />
    </div>
  {/if}
</div>

<style>
  .accordion-contents {
    margin-left: calc(var(--icon-size) + var(--size-4-1));
  }

  .status {
    color: var(--color-accent);
    justify-self: flex-end;
  }
</style>
