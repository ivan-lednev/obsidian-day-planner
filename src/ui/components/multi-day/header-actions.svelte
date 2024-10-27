<script lang="ts">
  import { settings } from "../../../global-store/settings";
  import Pill from "../pill.svelte";
</script>

<div class="view-header-nav-buttons">
  <Pill key="filter" value={$settings.dataviewSource} />
</div>

<style>
  .view-header-nav-buttons {
    display: flex;
    gap: var(--size-4-1);
  }
</style>
