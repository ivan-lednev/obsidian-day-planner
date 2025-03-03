<script lang="ts">
  export let visible = true;
</script>

<hr
  style:display={visible ? "block" : "none"}
  class="workspace-leaf-resize-handle"
  on:mousedown
/>
