<script lang="ts">
  import type { LocalTask, WithPlacing, WithTime } from "../../task-types";
  import { hoverPreview } from "../actions/hover-preview";
  import type { EditHandlers } from "../hooks/use-edit/create-edit-handlers";

  import RenderedMarkdown from "./rendered-markdown.svelte";
  import ScheduledTimeBlockControls from "./scheduled-time-block-controls.svelte";
  import ScheduledTimeBlock from "./scheduled-time-block.svelte";

  export let task: WithPlacing<WithTime<LocalTask>>;
  export let onGripMouseDown: EditHandlers["handleGripMouseDown"] | undefined =
    undefined;
  export let onResizerMouseDown:
    | EditHandlers["handleResizerMouseDown"]
    | undefined = undefined;
  export let onFloatingUiPointerDown:
    | ((event: PointerEvent) => void)
    | undefined = undefined;
</script>

<ScheduledTimeBlockControls
  {onFloatingUiPointerDown}
  {onGripMouseDown}
  {onResizerMouseDown}
  {task}
>
  {#snippet anchor({ actions, isActive })}
    <ScheduledTimeBlock
      --time-block-border-color-override={isActive ? "var(--color-accent)" : ""}
      --time-block-box-shadow={isActive
        ? "var(--shadow-stationary), var(--shadow-border-accent)"
        : ""}
      {task}
      use={[...actions, hoverPreview(task)]}
    >
      <RenderedMarkdown {task} />
    </ScheduledTimeBlock>
  {/snippet}
</ScheduledTimeBlockControls>
