<script lang="ts">
  import {
    FoldVertical,
    ArrowDownToLine,
    GripVertical,
    Copy,
  } from "lucide-svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask } from "../../task-types";
  import * as t from "../../util/task-utils";
  import { createGestures } from "../actions/gestures";
  import { EditMode } from "../hooks/use-edit/types";

  import BlockControlButton from "./block-control-button.svelte";
  import ExpandingControls from "./expanding-controls.svelte";

  export let isActive: boolean;
  export let setIsActive: (value: boolean) => void;
  export let task: LocalTask;

  const {
    editContext: {
      handlers: { handleGripMouseDown },
    },
  } = getObsidianContext();
</script>

<ExpandingControls {isActive} {setIsActive}>
  {#snippet initial()}
    <BlockControlButton
      cursor="grab"
      label="Move block"
      use={[
        createGestures({
          onpanmove: () => handleGripMouseDown(task, EditMode.DRAG),
        }),
      ]}
    >
      <GripVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
  {#snippet expanded()}
    <BlockControlButton
      cursor="grab"
      label="Copy block"
      use={[
        createGestures({
          onpanmove: () => handleGripMouseDown(t.copy(task), EditMode.DRAG),
        }),
      ]}
    >
      <Copy class="svg-icon" />
    </BlockControlButton>
    <BlockControlButton
      cursor="grab"
      label="Move block and push neighboring blocks"
      use={[
        createGestures({
          onpanmove: () =>
            handleGripMouseDown(task, EditMode.DRAG_AND_SHIFT_OTHERS),
        }),
      ]}
    >
      <ArrowDownToLine class="svg-icon" />
    </BlockControlButton>
    <BlockControlButton
      cursor="grab"
      label="Move block and shrink neighboring blocks"
      use={[
        createGestures({
          onpanmove: () =>
            handleGripMouseDown(task, EditMode.DRAG_AND_SHRINK_OTHERS),
        }),
      ]}
    >
      <FoldVertical class="svg-icon" />
    </BlockControlButton>
  {/snippet}
</ExpandingControls>
