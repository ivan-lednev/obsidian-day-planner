<script lang="ts">
  import type { Snippet } from "svelte";

  import { MouseButton } from "../../constants";
  import { getObsidianContext } from "../../context/obsidian-context";
  import { meetingNoteRequested } from "../../redux/meeting-notes/meeting-notes-listeners";
  import {
    isRemote,
    type RemoteTimeBlock,
    type TimelineTimeBlock,
  } from "../../time-block-types";
  import { isTouchEvent } from "../../util/dom";
  import { createGestures } from "../actions/gestures";

  import LocalTimeBlock from "./local-time-block.svelte";
  import RemoteTimeBlockContent from "./remote-time-block-content.svelte";
  import TimeBlockBase from "./time-block-base.svelte";
  import TimeBlockControls from "./time-block-controls.svelte";

  const {
    timeBlock,
    bottomDecoration,
  }: {
    timeBlock: TimelineTimeBlock;
    class?: string;
    bottomDecoration?: Snippet;
  } = $props();

  const { dispatch, isEditing, settingsSignal } = getObsidianContext();

  const meetingNotesEnabled = $derived(
    settingsSignal.current.meetingNotesEnabled,
  );

  function openMeetingNote(remoteTimeBlock: RemoteTimeBlock) {
    // Releasing a dragged block over an event should not open anything
    if (!meetingNotesEnabled || $isEditing) {
      return;
    }

    dispatch(
      meetingNoteRequested({
        ...remoteTimeBlock,
        startTime: remoteTimeBlock.startTime.toISOString(),
      }),
    );
  }

  function handleRemotePointerUp(
    event: PointerEvent,
    remoteTimeBlock: RemoteTimeBlock,
  ) {
    if (isTouchEvent(event) || event.button !== MouseButton.LEFT) {
      return;
    }

    openMeetingNote(remoteTimeBlock);
  }

  const remoteGestures = createGestures({
    ontap: () => {
      if (isRemote(timeBlock)) {
        openMeetingNote(timeBlock);
      }
    },
    options: { mouseSupport: false },
  });
</script>

{#if isRemote(timeBlock)}
  <TimeBlockBase
    --time-block-cursor={meetingNotesEnabled ? "pointer" : ""}
    onpointerup={(event) => handleRemotePointerUp(event, timeBlock)}
    {timeBlock}
    {@attach remoteGestures}
  >
    <RemoteTimeBlockContent {bottomDecoration} {timeBlock} />
  </TimeBlockBase>
{:else}
  <TimeBlockControls {timeBlock}>
    {#snippet content({
      isActive,
      onPointerUp,
      gestures,
      clearOnPointerUpOutside,
      anchor,
    })}
      <LocalTimeBlock
        {bottomDecoration}
        {isActive}
        onpointerup={onPointerUp}
        {timeBlock}
        {@attach gestures}
        {@attach clearOnPointerUpOutside}
        {@attach anchor}
      />
    {/snippet}
  </TimeBlockControls>
{/if}
