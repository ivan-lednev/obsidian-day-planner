<script lang="ts">
  import { type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";

  import { getObsidianContext } from "../../context/obsidian-context";
  import { timeRangeAtStartOfLineRegExp } from "../../regexp";
  import { type EditableTimeBlock } from "../../time-block-types";
  import { createMarkdownListTokens, getFirstLine } from "../../util/markdown";
  import { createTimeBlockMenu } from "../time-block-menu";

  import DragControls from "./drag-controls.svelte";
  import FloatingControls from "./floating-controls.svelte";
  import ResizeControls from "./resize-controls.svelte";
  import Selectable from "./selectable.svelte";

  interface TimeBlockProps {
    isActive: boolean;
    onPointerUp: (event: PointerEvent) => void;
    gestures: Attachment<HTMLElement>;
    clearOnPointerUpOutside: Attachment<HTMLElement>;
    anchor: Attachment<HTMLElement>;
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
  {#snippet children({ gestures, clearOnPointerUpOutside, state, onpointerup })}
    <FloatingControls active={state === "primary"}>
      {#snippet anchor({ anchor })}
        {@render content({
          isActive: state !== "none",
          onPointerUp: onpointerup,
          gestures,
          clearOnPointerUpOutside,
          anchor,
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
