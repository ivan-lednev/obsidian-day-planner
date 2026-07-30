<script lang="ts">
  import { type Snippet } from "svelte";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { timeRangeAtStartOfLineRegExp } from "../../regexp";
  import { type EditableTimeBlock } from "../../time-block-types";
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
    timeBlock,
    content,
  }: {
    timeBlock: EditableTimeBlock;
    class?: string;
    content: Snippet<[TimeBlockProps]>;
  } = $props();

  const {
    editContext: { editOperation },
    workspaceFacade,
    editText,
    editLine,
    deleteTimeBlock,
    logEntryEditor,
  } = getObsidianContext();

  async function editTimeBlockSummary() {
    if (timeBlock.source === "unwritten") {
      throw new Error("Cannot edit the summary of an unwritten time block");
    }

    // todo: replace with getOnelineSummary()
    const firstLine = getFirstLine(timeBlock.text);
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
      path: timeBlock.path,
      position: timeBlock.position.start,
      contents: `${createMarkdownListTokens(timeBlock)} ${lineStart}${next}`,
    });
  }
</script>

<Selectable
  onSecondarySelect={(event) =>
    createTimeBlockMenu({
      event,
      timeBlock,
      logEntryEditor,
      workspaceFacade,
      onEdit: editTimeBlockSummary,
      onDelete: deleteTimeBlock,
    })}
  selectionBlocked={Boolean($editOperation)}
>
  {#snippet children(selectable)}
    <FloatingControls active={selectable.state === "primary"}>
      {#snippet anchor(floatingControls)}
        {@render content({
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
          {timeBlock}
        />
      {/snippet}

      {#snippet bottom({ isActive, setIsActive })}
        {#if !timeBlock.isAllDayEvent}
          <ResizeControls {isActive} reverse {setIsActive} {timeBlock} />
        {/if}
      {/snippet}

      {#snippet top({ isActive, setIsActive })}
        {#if !timeBlock.isAllDayEvent}
          <ResizeControls
            fromTop
            {isActive}
            reverse
            {setIsActive}
            {timeBlock}
          />
        {/if}
      {/snippet}
    </FloatingControls>
  {/snippet}
</Selectable>
