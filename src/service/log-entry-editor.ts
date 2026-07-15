import type { LogTimeBlock } from "../time-block-types";

import type { FrontmatterLogEntryEditor } from "./frontmatter-log-entry-editor";
import type { ListItemEntryEditor } from "./list-item-entry-editor";

// todo: introduce a common mechanism for Frontmatter vs task props vs in-editor edits
export class LogEntryEditor {
  clockIn = (task: LogTimeBlock) =>
    task.source === "frontmatterLog"
      ? this.frontmatterLogEntryEditor.clockInAtPath(task.path)
      : this.listItemEntryEditor.clockInAtLocation({
          path: task.path,
          line: task.position.start.line,
        });

  clockOut = (task: LogTimeBlock) =>
    task.source === "frontmatterLog"
      ? this.frontmatterLogEntryEditor.clockOutAtPath(task.path)
      : this.listItemEntryEditor.clockOutAtLocation({
          path: task.path,
          line: task.position.start.line,
        });

  cancelClock = (task: LogTimeBlock) =>
    task.source === "frontmatterLog"
      ? this.frontmatterLogEntryEditor.cancelClockAtPath(task.path)
      : this.listItemEntryEditor.cancelClockAtLocation({
          path: task.path,
          line: task.position.start.line,
        });

  editLastClock = (
    task: LogTimeBlock,
    patch: { start?: string; end?: string },
  ) =>
    task.source === "frontmatterLog"
      ? this.frontmatterLogEntryEditor.editLastClockAtPath(task.path, patch)
      : this.listItemEntryEditor.editLastClockAtLocation(
          { path: task.path, line: task.position.start.line },
          patch,
        );

  constructor(
    private readonly listItemEntryEditor: ListItemEntryEditor,
    private readonly frontmatterLogEntryEditor: FrontmatterLogEntryEditor,
  ) {}
}
