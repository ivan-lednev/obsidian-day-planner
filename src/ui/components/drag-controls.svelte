<script lang="ts">
  import {
    FoldVertical,
    ArrowDownToLine,
    GripVertical,
    Copy,
  } from "lucide-svelte";

  import { createGestures } from "../actions/gestures";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let isActive: boolean;
  export let setIsActive: (value: boolean) => void;
  export let onMove: (event: PointerEvent) => void;
  export let onMoveWithNeighbors: (event: PointerEvent) => void = () => {};
  export let onCopy: (event: PointerEvent) => void = () => {};
  export let onMoveWithShrink: (event: PointerEvent) => void = () => {};
  // TODO: return this handler
  export let onPointerDown: (event: PointerEvent) => void = () => {};
</script>

<ExpandingControls {isActive} {setIsActive}>
  {#snippet initial()}
    <BlockControlButton
      cursor="grab"
      label="Move block"
      use={[
        createGestures({
          onpanmove: onMove,
        }),
      ]}
    >
      <GripVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
  {#snippet expanded()}
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
  {/snippet}
</ExpandingControls>
