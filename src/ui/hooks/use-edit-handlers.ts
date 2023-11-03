import { Moment } from "moment/moment";
import { get, Readable } from "svelte/store";

import { ObsidianFacade } from "../../service/obsidian-facade";
import { PlacedTask, UnscheduledTask } from "../../types";
import { copy } from "../../util/task-utils";

import { createTask } from "./use-edit/transform/create";
import { EditMode } from "./use-edit/types";
import { useEdit } from "./use-edit/use-edit";

export interface UseTasksProps
  extends Pick<ReturnType<typeof useEdit>, "startEdit"> {
  day: Moment;
  obsidianFacade: ObsidianFacade;
  cursorMinutes: Readable<number>;
  dayUnderEdit: Readable<Moment>;
}

export function useEditHandlers({
  day,
  obsidianFacade,
  startEdit,
  cursorMinutes,
  dayUnderEdit,
}: UseTasksProps) {
  async function handleMouseDown() {
    const newTask = await createTask(day, get(cursorMinutes));

    startEdit({ task: { ...newTask, isGhost: true }, mode: EditMode.CREATE });
  }

  function handleResizeStart(event: MouseEvent, task: PlacedTask) {
    const mode = event.ctrlKey
      ? EditMode.RESIZE_AND_SHIFT_OTHERS
      : EditMode.RESIZE;

    startEdit({ task, mode });
  }

  async function handleTaskMouseUp(task: UnscheduledTask) {
    if (get(dayUnderEdit)) {
      return;
    }

    const { path, line } = task.location;
    await obsidianFacade.revealLineInFile(path, line);
  }

  function handleGripMouseDown(event: MouseEvent, task: PlacedTask) {
    if (event.ctrlKey) {
      startEdit({ task, mode: EditMode.DRAG_AND_SHIFT_OTHERS });
    } else if (event.shiftKey) {
      startEdit({ task: copy(task), mode: EditMode.CREATE });
    } else {
      startEdit({ task, mode: EditMode.DRAG });
    }
  }

  function startScheduling(task: UnscheduledTask) {
    const withAddedTime = {
      ...task,
      startMinutes: get(cursorMinutes),
      // todo: remove this. It's added just for type compatibility
      startTime: window.moment(),
    };

    startEdit({ task: withAddedTime, mode: EditMode.SCHEDULE });
  }

  function handleMouseEnter() {
    dayUnderEdit.set(day);
  }

  return {
    handleMouseEnter,
    handleMouseDown,
    handleResizeStart,
    handleTaskMouseUp,
    handleGripMouseDown,
    startScheduling,
  };
}
