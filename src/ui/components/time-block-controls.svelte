<script lang="ts">
  import { type Snippet } from "svelte";
  import { isNotVoid } from "typed-assert";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { timeRangeAtStartOfLineRegExp } from "../../regexp";
  import { type LocalTask } from "../../task-types";
  import { createMarkdownListTokens, getFirstLine } from "../../util/markdown";
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
    editText,
    editLine,
  } = getObsidianContext();

  async function editTaskSummary() {
    isNotVoid(task.location);

    // todo: replace with getOnelineSummary()
    const firstLine = getFirstLine(task.text);
    const timestampMatch = firstLine.match(timeRangeAtStartOfLineRegExp);
    const timestampEnd = timestampMatch ? timestampMatch[0].length : 0;
    const afterTimestamp = firstLine.slice(timestampEnd);
    const leadingSpace = afterTimestamp.match(/^\s*/)?.[0] ?? "";
    const summary = afterTimestamp.slice(leadingSpace.length);

    const next = await editText({
      initialText: summary,
      getDescriptionText: (value) =>
        value.trim().length === 0
          ? "Start typing to update task text"
          : `Update to "${value}"`,
    });

    if (next === undefined || next === summary) {
      return;
    }

    const lineStart = firstLine.slice(0, timestampEnd) + leadingSpace;

    await editLine({
      path: task.location.path,
      position: task.location.position.start,
      contents: `${createMarkdownListTokens(task)} ${lineStart}${next}`,
    });
  }
</script>

<Selectable
  onSecondarySelect={(event) =>
    createTimeBlockMenu({
      event,
      task,
      workspaceFacade,
      onEdit: editTaskSummary,
    })}
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
