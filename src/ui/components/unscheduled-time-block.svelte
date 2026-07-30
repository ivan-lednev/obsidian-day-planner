<script lang="ts">
  import type { Snippet } from "svelte";

  import { isRemote, type TimelineTimeBlock } from "../../time-block-types";

  import LocalTimeBlock from "./local-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import TimeBlockBase from "./time-block-base.svelte";
  import TimeBlockControls from "./time-block-controls.svelte";

  const {
    timeBlock,
    bottomDecoration,
  }: {
    timeBlock: TimelineTimeBlock;
    class?: string;
    bottomDecoration?: Snippet;
  } = $props();
</script>

{#if isRemote(timeBlock)}
  <TimeBlockBase {timeBlock}>
    <RemoteTimeBlockContent {bottomDecoration} {timeBlock} />
  </TimeBlockBase>
{:else}
  <TimeBlockControls {timeBlock}>
    {#snippet content({ isActive, onPointerUp, use })}
      <LocalTimeBlock
        {bottomDecoration}
        {isActive}
        onpointerup={onPointerUp}
        {timeBlock}
        {use}
      />
    {/snippet}
  </TimeBlockControls>
{/if}
