<script lang="ts">
  export let isActive;
  export let onClick;
</script>

<div
  aria-label="Settings"
  class="clickable-icon is-active"
  class:is-active={isActive}
  on:click={onClick}
>
  <svg
    class="svg-icon lucide-sliders-horizontal"
    fill="none"
    height="24"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
    viewBox="0 0 24 24"
    width="24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line x1="21" x2="14" y1="4" y2="4"></line>
    <line x1="10" x2="3" y1="4" y2="4"></line>
    <line x1="21" x2="12" y1="12" y2="12"></line>
    <line x1="8" x2="3" y1="12" y2="12"></line>
    <line x1="21" x2="16" y1="20" y2="20"></line>
    <line x1="12" x2="3" y1="20" y2="20"></line>
    <line x1="14" x2="14" y1="2" y2="6"></line>
    <line x1="8" x2="8" y1="10" y2="14"></line>
    <line x1="16" x2="16" y1="18" y2="22"></line>
  </svg>
</div>

<style>
  .clickable-icon {
    flex-basis: var(--input-height);
    align-self: center;
  }
</style>
