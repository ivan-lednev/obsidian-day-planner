<script lang="ts">
  import { offset } from "@floating-ui/dom";
  import type { Snippet } from "svelte";

  import { vibrationDurationMillis } from "../../constants";
  import { getObsidianContext } from "../../context/obsidian-context";
  import type { LocalTask } from "../../task-types";
  import type { EditHandlers } from "../hooks/use-edit/create-edit-handlers";
  import { useFloatingUi } from "../hooks/use-floating-ui";

  import DragControls from "./drag-controls.svelte";
  import FloatingUi from "./floating-ui.svelte";
  import RenderedMarkdown from "./rendered-markdown.svelte";
  import TimeBlockBase from "./time-block-base.svelte";

  const {
    task,
    children,
    onGripMouseDown,
    onpointerup,
  }: {
    task: LocalTask;
    onpointerup: (event: PointerEvent) => void;
    onGripMouseDown?: EditHandlers["handleUnscheduledTaskGripMouseDown"];
    children?: Snippet;
  } = $props();

  const {
    editContext: { editOperation },
  } = getObsidianContext();

  const drag = useFloatingUi({
    middleware: [offset({ mainAxis: -32, crossAxis: -4 })],
    placement: "top-end",
  });

  const { isActive } = drag;
</script>

<TimeBlockBase
  {task}
  use={[drag.anchorSetup]}
  on:longpress={() => {
    navigator?.vibrate(vibrationDurationMillis);
    isActive.set(true);
  }}
  on:pointerenter={drag.handleAnchorPointerEnter}
  on:pointerleave={drag.handleAnchorPointerLeave}
  on:pointerup={onpointerup}
>
  <RenderedMarkdown {task} />
  {@render children?.()}
</TimeBlockBase>

{#if !$editOperation && $isActive && onGripMouseDown}
  <FloatingUi
    onPointerLeave={drag.handleFloatingUiPointerLeave}
    onTapOutside={drag.handleFloatingUiTapOutside}
    use={[drag.floatingUiSetup]}
  >
    <DragControls onMove={() => onGripMouseDown(task)} />
  </FloatingUi>
{/if}
