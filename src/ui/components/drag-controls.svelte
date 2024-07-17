<script lang="ts">
  import {
    FoldVertical,
    ArrowDownToLine,
    GripVertical,
    Copy,
  } from "lucide-svelte";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let onMove: (event: PointerEvent) => void;
  export let onMoveWithNeighbors: (event: PointerEvent) => void | undefined =
    undefined;
  export let onCopy: (event: PointerEvent) => void | undefined = undefined;
  export let onMoveWithShrink: (event: PointerEvent) => void | undefined =
    undefined;
</script>

<ExpandingControls --right="4px" --top="4px">
  <BlockControlButton
    slot="visible"
    cursor="grab"
    label="Move block"
    on:pointerdown={(event) => {
      if (isActive) {
        onMove(event);
      }
    }}
    let:isActive
  >
    <GripVertical class="svg-icon" />
  </BlockControlButton>
  <svelte:fragment slot="hidden">
    {#if onCopy}
      <BlockControlButton
        cursor="grab"
        label="Copy block"
        on:pointerdown={onCopy}
      >
        <Copy class="svg-icon" />
      </BlockControlButton>
    {/if}
    {#if onMoveWithNeighbors}
      <BlockControlButton
        cursor="grab"
        label="Move block and push neighboring blocks"
        on:pointerdown={onMoveWithNeighbors}
      >
        <ArrowDownToLine class="svg-icon" />
      </BlockControlButton>
    {/if}
    {#if onMoveWithShrink}
      <BlockControlButton
        cursor="grab"
        label="Move block and shrink neighboring blocks"
        on:pointerdown={onMoveWithShrink}
      >
        <FoldVertical class="svg-icon" />
      </BlockControlButton>
    {/if}
  </svelte:fragment>
</ExpandingControls>
