<script lang="ts">
  import { type Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { type LocalTask } from "../../task-types";
  import type { HTMLActionArray } from "../actions/use-actions";
  import { createTimeBlockMenu } from "../time-block-menu";

  import DragControls from "./drag-controls.svelte";
  import FloatingControls from "./floating-controls.svelte";
  import ResizeControls from "./resize-controls.svelte";
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
    editContext: { editOperation },
    workspaceFacade,
  } = getObsidianContext();
</script>

<Selectable
  onSecondarySelect={(event) =>
    createTimeBlockMenu({ event, task, workspaceFacade })}
  selectionBlocked={Boolean($editOperation)}
>
  {#snippet children(selectable)}
    <FloatingControls active={selectable.state === "primary"}>
      {#snippet anchor(floatingControls)}
        {@render timeBlock({
          isActive: selectable.state !== "none",
          onPointerUp: selectable.onpointerup,
          use: [...selectable.use, ...floatingControls.actions],
        })}
      {/snippet}

      {#snippet topEnd({ isActive, setIsActive })}
        <DragControls
          --expanding-controls-position="absolute"
          {isActive}
          {setIsActive}
          {task}
        />
      {/snippet}

      {#snippet bottom({ isActive, setIsActive })}
        {#if !task.isAllDayEvent}
          <ResizeControls {isActive} reverse {setIsActive} {task} />
        {/if}
      {/snippet}

      {#snippet top({ isActive, setIsActive })}
        {#if !task.isAllDayEvent}
          <ResizeControls fromTop {isActive} reverse {setIsActive} {task} />
        {/if}
      {/snippet}
    </FloatingControls>
  {/snippet}
</Selectable>
