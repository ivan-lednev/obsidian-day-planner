<script lang="ts">
  import ControlButton from "./control-button.svelte";

  // TODO: there is no type export in Svelte that satisfies this. Find another way
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let icon: any;
</script>

<div style:display="contents" class="accordion-button">
  <ControlButton
    --align-self="stretch"
    --flex-basis="auto"
    --justify-content="flex-start"
    classes="day-planner-clickable-icon"
    on:click
  >
    <div class="button-text">
      <svelte:component this={icon} class="svg-icon" />
      <slot />
    </div>
  </ControlButton>
</div>

<style>
  .accordion-button :global(.clickable-icon) {
    padding: var(--size-4-1) 0 var(--size-2-1) var(--size-4-4);
    border-radius: 0;
  }

  .button-text {
    display: inline-flex;
    gap: var(--size-4-1);
  }
</style>
