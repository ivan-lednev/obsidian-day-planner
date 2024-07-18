<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { ObsidianContext, Task } from "../../types";
  import { copy } from "../../util/task-utils";
  import { EditHandlers } from "../hooks/use-edit/create-edit-handlers";
  import { EditMode } from "../hooks/use-edit/types";
  import { useFloatingUi } from "../hooks/use-floating-ui";

  import DragControls from "./drag-controls.svelte";
  import FloatingUi from "./floating-ui.svelte";
  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import ResizeControls from "./resize-controls.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: Task;
  export let onGripMouseDown: EditHandlers['handleGripMouseDown'];
  export let onResizerMouseDown: EditHandlers['handleResizerMouseDown'];
  export let onFloatingUiPointerDown: (event: PointerEvent) => void;

  const {
    editContext: { editOperation },
  } = getContext<ObsidianContext>(obsidianContext);

  const drag = useFloatingUi({
    middleware: [offset({ mainAxis: -32, crossAxis: -4 })],
    placement: "top-end",
  });

  const { isActive: isDragActive } = drag;

  const resize = useFloatingUi({
    middleware: [offset({ mainAxis: -14, crossAxis: -40 })],
    placement: "bottom-end",
  });

  const { isActive: isResizeActive } = resize;

  const resizeFromTop = useFloatingUi({
    middleware: [offset({ mainAxis: -12, crossAxis: 40 })],
    placement: "top-start",
  });

  const { isActive: isResizeFromTopActive } = resizeFromTop;
</script>

<ScheduledTimeBlock
  {task}
  use={[drag.anchorSetup, resize.anchorSetup, resizeFromTop.anchorSetup]}
  on:pointerup
  on:pointerenter={(event) => {
    drag.handleAnchorPointerEnter(event);
    resize.handleAnchorPointerEnter(event);
    resizeFromTop.handleAnchorPointerEnter(event);
  }}
  on:pointerleave={(event) => {
    drag.handleAnchorPointerLeave(event);
    resize.handleAnchorPointerLeave(event);
    resizeFromTop.handleAnchorPointerLeave(event);
  }}
>
  <MarkdownBlockContent {task}>
    <RenderedMarkdown {task} />
  </MarkdownBlockContent>
</ScheduledTimeBlock>

{#if !$editOperation}
  {#if $isDragActive}
    <FloatingUi
      onPointerDown={onFloatingUiPointerDown}
      onPointerLeave={drag.handleFloatingUiPointerLeave}
      onTapOutside={drag.handleFloatingUiTapOutside}
      use={[drag.floatingUiSetup]}
    >
      <DragControls
        isExpandable
        onCopy={() => {
          onGripMouseDown(copy(task), EditMode.DRAG);
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

  {#if $isResizeActive}
    <FloatingUi
      onPointerDown={onFloatingUiPointerDown}
      onPointerLeave={resize.handleFloatingUiPointerLeave}
      onTapOutside={resize.handleFloatingUiTapOutside}
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
      />
    </FloatingUi>
  {/if}

  {#if $isResizeFromTopActive}
    <FloatingUi
      onPointerDown={onFloatingUiPointerDown}
      onPointerLeave={resizeFromTop.handleFloatingUiPointerLeave}
      onTapOutside={resizeFromTop.handleFloatingUiTapOutside}
      use={[resizeFromTop.floatingUiSetup]}
    >
      <ResizeControls
        onResize={() => {
          onResizerMouseDown(task, EditMode.RESIZE_FROM_TOP);
        }}
        onResizeWithNeighbors={() => {
          onResizerMouseDown(task, EditMode.RESIZE_FROM_TOP_AND_SHIFT_OTHERS);
        }}
        onResizeWithShrink={() => {
          onResizerMouseDown(task, EditMode.RESIZE_FROM_TOP_AND_SHRINK_OTHERS);
        }}
        reverse
      />
    </FloatingUi>
  {/if}
{/if}
