<script lang="ts">
  import type { Snippet } from "svelte";

  import type { FrontmatterLogTimeBlock } from "../../time-block-types";

  import TimeBlockContentLayout from "./time-block-content-layout.svelte";

  const {
    task,
    bottomDecoration,
  }: { task: FrontmatterLogTimeBlock; bottomDecoration?: Snippet } = $props();
</script>

<TimeBlockContentLayout {bottomDecoration}>
  {#snippet title()}
    <div class="file-name">
      {task.text}
    </div>
  {/snippet}
</TimeBlockContentLayout>

<style>
  .file-name {
    font-weight: var(
      --planner-time-block-summary-font-weight,
      var(--font-semibold)
    );
  }
</style>
