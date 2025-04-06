<script lang="ts">
  import { isRemote, type Task } from "../../task-types";

  import LocalTimeBlock from "./local-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import TimeBlockBase from "./time-block-base.svelte";
  import TimeBlockControls from "./time-block-controls.svelte";

  const { task }: { task: Task; class?: string } = $props();
</script>

{#if isRemote(task)}
  <TimeBlockBase {task}>
    <RemoteTimeBlockContent {task} />
  </TimeBlockBase>
{:else}
  <TimeBlockControls {task}>
    {#snippet timeBlock({ isActive, onPointerUp, use })}
      <LocalTimeBlock {isActive} onpointerup={onPointerUp} {task} {use} />
    {/snippet}
  </TimeBlockControls>
{/if}
