import { Moment } from "moment/moment";
import { get, Readable, Writable } from "svelte/store";

import { ObsidianFacade } from "../../../service/obsidian-facade";
import { PlacedTask, UnscheduledTask } from "../../../types";
import { copy, createTask } from "../../../util/task-utils";

import { EditMode, EditOperation } from "./types";

export interface UseEditHandlersProps {
  startEdit: (operation: EditOperation) => void;
  day: Moment;
  obsidianFacade: ObsidianFacade;
  cursorMinutes: Readable<number>;
  editOperation: Writable<EditOperation>;
}

export function useEditHandlers({
  day,
  obsidianFacade,
  startEdit,
  cursorMinutes,
  editOperation,
}: UseEditHandlersProps) {
  function handleContainerMouseDown() {
    const newTask = createTask(day, get(cursorMinutes));

    startEdit({
      task: { ...newTask, isGhost: true },
      mode: EditMode.CREATE,
      day,
    });
  }

  function handleResizerMouseDown(event: MouseEvent, task: PlacedTask) {
    const mode = event.ctrlKey
      ? EditMode.RESIZE_AND_SHIFT_OTHERS
      : EditMode.RESIZE;

    startEdit({ task, mode, day });
  }

  async function handleTaskMouseUp(task: UnscheduledTask) {
    if (get(editOperation)) {
      return;
    }

    const { path, line } = task.location;
    await obsidianFacade.revealLineInFile(path, line);
  }

  function handleGripMouseDown(event: MouseEvent, task: PlacedTask) {
    if (event.ctrlKey) {
      startEdit({ task, mode: EditMode.DRAG_AND_SHIFT_OTHERS, day });
    } else if (event.shiftKey) {
      startEdit({ task: copy(task), mode: EditMode.CREATE, day });
    } else {
      startEdit({ task, mode: EditMode.DRAG, day });
    }
  }

  function handleUnscheduledTaskGripMouseDown(task: UnscheduledTask) {
    const withAddedTime = {
      ...task,
      startMinutes: get(cursorMinutes),
      startTime: window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.DRAG, day });
  }

  return {
    handleGripMouseDown,
    handleContainerMouseDown,
    handleResizerMouseDown,
    handleTaskMouseUp,
    handleUnscheduledTaskGripMouseDown,
  };
}
