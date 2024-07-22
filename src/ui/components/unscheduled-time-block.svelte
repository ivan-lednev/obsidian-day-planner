<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import { getContext } from "svelte";

  import { obsidianContext } from "../../constants";
  import { ObsidianContext, UnscheduledTask } from "../../types";
  import { isTouchEvent } from "../../util/util";
  import { EditHandlers } from "../hooks/use-edit/create-edit-handlers";
  import { useFloatingUi } from "../hooks/use-floating-ui";

  import DragControls from "./drag-controls.svelte";
  import FloatingUi from "./floating-ui.svelte";
  import MarkdownBlockContent from "./markdown-block-content.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  export let task: UnscheduledTask;
  export let onGripMouseDown: EditHandlers["handleUnscheduledTaskGripMouseDown"];
  export let onMouseUp: () => void;

  const {
    editContext: { editOperation },
  } = getContext<ObsidianContext>(obsidianContext);

  const drag = useFloatingUi({
    middleware: [offset({ mainAxis: -32, crossAxis: -4 })],
    placement: "top-end",
  });

  const { isActive } = drag;
</script>

<TimeBlockBase
  {task}
  use={[drag.anchorSetup]}
  on:tap={onMouseUp}
  on:longpress={() => {
    navigator.vibrate(100);
    isActive.set(true);
  }}
  on:pointerup={(event) => {
    if (!isTouchEvent(event)) {
      onMouseUp();
    }
  }}
  on:pointerenter={drag.handleAnchorPointerEnter}
  on:pointerleave={drag.handleAnchorPointerLeave}
>
  <MarkdownBlockContent {task}>
    <RenderedMarkdown {task} />
  </MarkdownBlockContent>
</TimeBlockBase>

{#if !$editOperation}
  {#if $isActive}
    <FloatingUi
      onPointerLeave={drag.handleFloatingUiPointerLeave}
      onTapOutside={drag.handleFloatingUiTapOutside}
      use={[drag.floatingUiSetup]}
    >
      <DragControls onMove={() => onGripMouseDown(task)} />
    </FloatingUi>
  {/if}
{/if}
