<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { type Snippet } from "svelte";

  import { floatingUiOffset } from "../../constants";
  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask, WithPlacing } from "../../task-types";
  import * as t from "../../util/task-utils";
  import { createGestures } from "../actions/gestures";
  import { pointerUpOutside } from "../actions/pointer-up-outside";
  import { type HTMLActionArray } from "../actions/use-actions";
  import { createOffsetFnWithFrozenCrossAxis } from "../floating-ui-util";
  import type { EditHandlers } from "../hooks/use-edit/create-edit-handlers";
  import { EditMode } from "../hooks/use-edit/types";
  import { useFloatingUi } from "../hooks/use-floating-ui";

  import DragControls from "./drag-controls.svelte";
  import FloatingUi from "./floating-ui.svelte";
  import ResizeControls from "./resize-controls.svelte";

  interface AnchorProps {
    actions: HTMLActionArray;
    isActive: boolean;
  }

  interface Props {
    anchor: Snippet<[AnchorProps]>;
    onGripMouseDown?: EditHandlers["handleGripMouseDown"];
    onResizerMouseDown?: EditHandlers["handleResizerMouseDown"];
    onFloatingUiPointerDown?: (event: PointerEvent) => void;
    task: WithPlacing<LocalTask>;
  }

  const {
    anchor,
    onGripMouseDown,
    onResizerMouseDown,
    onFloatingUiPointerDown,
    task,
  }: Props = $props();

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  let isDragActive = $state(false);
  let isResizeActive = $state(false);

  const drag = useFloatingUi({
    middleware: [offset({ mainAxis: floatingUiOffset })],
    placement: "top-end",
  });

  const resize = useFloatingUi({
    middleware: [offset(createOffsetFnWithFrozenCrossAxis())],
    placement: "bottom-start",
  });
</script>

{@render anchor({
  actions: [
    drag.anchorSetup,
    resize.anchorSetup,
    createGestures({
      ontap: () => {
        isDragActive = true;
        isResizeActive = true;
      },
    }),
    pointerUpOutside(() => {
      isDragActive = false;
      isResizeActive = false;
    }),
  ],
  isActive: isDragActive || isResizeActive,
})}

<!--TODO: remove onFloatingUiPointerDown-->
{#if !$editOperation && onFloatingUiPointerDown}
  {#if isDragActive && onGripMouseDown}
    <FloatingUi
      onPointerDown={onFloatingUiPointerDown}
      onpointerup={(event) => {
        event.stopPropagation();
      }}
      use={[drag.floatingUiSetup]}
    >
      <DragControls
        onCopy={() => {
          onGripMouseDown(t.copy(task), EditMode.DRAG);
        }}
        onMove={() => onGripMouseDown(task, EditMode.DRAG)}
        onMoveWithNeighbors={() => {
          onGripMouseDown(task, EditMode.DRAG_AND_SHIFT_OTHERS);
        }}
        onMoveWithShrink={() => {
          onGripMouseDown(task, EditMode.DRAG_AND_SHRINK_OTHERS);
        }}
      />
    </FloatingUi>
  {/if}

  {#if onResizerMouseDown}
    {#if isResizeActive}
      <FloatingUi
        onPointerDown={onFloatingUiPointerDown}
        use={[resize.floatingUiSetup]}
      >
        <ResizeControls
          onResize={() => {
            onResizerMouseDown(task, EditMode.RESIZE);
          }}
          onResizeWithNeighbors={() => {
            onResizerMouseDown(task, EditMode.RESIZE_AND_SHIFT_OTHERS);
          }}
          onResizeWithShrink={() => {
            onResizerMouseDown(task, EditMode.RESIZE_AND_SHRINK_OTHERS);
          }}
          reverse
        />
      </FloatingUi>
    {/if}
  {/if}
{/if}
