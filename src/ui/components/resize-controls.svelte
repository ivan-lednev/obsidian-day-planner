<script lang="ts">
  import { ArrowDownToLine, MoveVertical, FoldVertical } from "lucide-svelte";

  import { createGestures } from "../actions/gestures";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let onResize: (event: PointerEvent) => void;
  export let onResizeWithNeighbors: (event: PointerEvent) => void;
  export let onResizeWithShrink: (event: PointerEvent) => void;
  export let onPointerDown: (event: PointerEvent) => void = () => {};
  export let reverse: boolean | undefined = false;
</script>

<ExpandingControls {reverse} on:pointerdown={onPointerDown}>
  {#snippet initial()}
    <BlockControlButton
      cursor="grab"
      label="Resize block"
      use={[
        createGestures({
          onpanmove: onResize,
        }),
      ]}
    >
      <MoveVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
  {#snippet expanded()}
    <BlockControlButton
      cursor="grab"
      label="Resize block and push neighboring blocks"
      on:pointerdown={onResizeWithNeighbors}
    >
      <ArrowDownToLine class="svg-icon" />
    </BlockControlButton>
    <BlockControlButton
      cursor="grab"
      label="Resize block and shrink neighboring blocks"
      on:pointerdown={onResizeWithShrink}
    >
      <FoldVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
</ExpandingControls>
