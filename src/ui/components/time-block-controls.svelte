<script lang="ts">
  import { type Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { type LocalTask } from "../../task-types";
  import type { HTMLActionArray } from "../actions/use-actions";
  import { createBlockDragResize } from "../actions/block-drag-resize";
  import { createTimeBlockMenu } from "../time-block-menu";

  import Selectable from "./selectable.svelte";

  interface TimeBlockProps {
    isActive: boolean;
    onPointerUp: (event: PointerEvent) => void;
    use: HTMLActionArray;
  }

  const {
    task,
    timeBlock,
  }: {
    task: LocalTask;
    class?: string;
    timeBlock: Snippet<[TimeBlockProps]>;
  } = $props();

  const {
    editContext: {
      editOperation,
      handlers: { handleGripMouseDown, handleResizerMouseDown },
    },
    workspaceFacade,
  } = getObsidianContext();

  const blockDragResize = createBlockDragResize({
    getTask: () => task,
    handleGripMouseDown,
    handleResizerMouseDown,
  });
</script>

<Selectable
  onSecondarySelect={(event) =>
    createTimeBlockMenu({ event, task, workspaceFacade })}
  selectionBlocked={Boolean($editOperation)}
>
  {#snippet children(selectable)}
    {@render timeBlock({
      isActive: selectable.state !== "none",
      onPointerUp: selectable.onpointerup,
      use: [...selectable.use, blockDragResize],
    })}
  {/snippet}
</Selectable>
