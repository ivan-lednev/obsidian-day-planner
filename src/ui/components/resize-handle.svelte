<script lang="ts">
  export let visible = true;
</script>

<hr
  style:display={visible ? "block" : "none"}
  class="workspace-leaf-resize-handle"
  on:mousedown
/>

<style>
  :not(#dummy).workspace-leaf-resize-handle {
    cursor: row-resize;

    right: 0;
    bottom: 0;
    left: 0;

    height: var(--divider-width-hover);

    border-bottom-width: var(--divider-width);
  }
</style>
