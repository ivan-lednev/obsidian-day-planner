<script lang="ts">
  import { GripVertical } from "lucide-svelte";

  export let cursor: string;
</script>

<div style:cursor class="grip" on:mousedown|stopPropagation>
  <GripVertical class="svg-icon" />
</div>

<style>
  .grip {
    position: relative;
    right: -4px;

    grid-column: 2;
    align-self: flex-start;

    color: var(--text-faint);
  }

  .grip:hover {
    color: var(--text-muted);
  }
</style>
