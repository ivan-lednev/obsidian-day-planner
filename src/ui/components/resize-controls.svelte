<script lang="ts">
  import { ArrowDownToLine, MoveVertical, FoldVertical } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask } from "../../task-types";
  import { createGestures } from "../actions/gestures";
  import { EditMode } from "../hooks/use-edit/types";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let task: LocalTask;
  export let isActive: boolean;
  export let setIsActive: (value: boolean) => void;
  export let reverse: boolean | undefined = false;
  export let fromTop: boolean | undefined = false;

  const {
    editContext: {
      handlers: { handleResizerMouseDown },
    },
  } = getObsidianContext();
</script>

<ExpandingControls {isActive} {reverse} {setIsActive}>
  {#snippet initial()}
    <BlockControlButton
      cursor="grab"
      label="Resize block"
      use={[
        createGestures({
          onpanmove: () =>
            handleResizerMouseDown(
              task,
              fromTop ? EditMode.RESIZE_FROM_TOP : EditMode.RESIZE,
            ),
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
      use={[
        createGestures({
          onpanmove: () => {
            handleResizerMouseDown(
              task,
              fromTop
                ? EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS
                : EditMode.RESIZE_AND_SHIFT_OTHERS,
            );
          },
        }),
      ]}
    >
      <ArrowDownToLine class="svg-icon" />
    </BlockControlButton>
    <BlockControlButton
      cursor="grab"
      label="Resize block and shrink neighboring blocks"
      use={[
        createGestures({
          onpanmove: () => {
            handleResizerMouseDown(
              task,
              fromTop
                ? EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS
                : EditMode.RESIZE_AND_SHRINK_OTHERS,
            );
          },
        }),
      ]}
    >
      <FoldVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
</ExpandingControls>
