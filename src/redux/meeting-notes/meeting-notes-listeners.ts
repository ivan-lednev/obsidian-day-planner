import { createAction } from "@reduxjs/toolkit";
import { Notice } from "obsidian";

import type { MeetingNotes } from "../../service/meeting-notes";
import type { SerializedRemoteTimeBlock } from "../ical/ical-slice";
import type { initListenerMiddleware } from "../listener-middleware";

export const meetingNoteRequested = createAction<SerializedRemoteTimeBlock>(
  "meetingNotes/meetingNoteRequested",
);

export const vaultFileRenamed = createAction<{
  oldPath: string;
  newPath: string;
}>("meetingNotes/vaultFileRenamed");

export const vaultFileDeleted = createAction<{ path: string }>(
  "meetingNotes/vaultFileDeleted",
);

export function startMeetingNoteListeners(props: {
  listenerMiddleware: ReturnType<typeof initListenerMiddleware>;
  meetingNotes: MeetingNotes;
}) {
  const { listenerMiddleware, meetingNotes } = props;

  listenerMiddleware.startListening({
    actionCreator: meetingNoteRequested,
    effect: async ({ payload }) => {
      try {
        await meetingNotes.openOrCreateMeetingNote({
          ...payload,
          startTime: window.moment(payload.startTime),
        });
      } catch (error) {
        new Notice(`Could not open meeting notes: ${String(error)}`);

        console.error(error);
      }
    },
  });

  listenerMiddleware.startListening({
    actionCreator: vaultFileRenamed,
    effect: ({ payload: { oldPath, newPath } }) => {
      meetingNotes.handleRename(oldPath, newPath);
    },
  });

  listenerMiddleware.startListening({
    actionCreator: vaultFileDeleted,
    effect: ({ payload: { path } }) => {
      meetingNotes.handleDelete(path);
    },
  });
}
