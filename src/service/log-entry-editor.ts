import type { LogTimeBlock } from "../time-block-types";
import {
  addOpenClock,
  addOpenClockOrCreateProps,
  cancelOpenClock,
  clockOut,
  editLastLogEntry,
} from "../util/props";

import { editYaml, requireProps, type YamlEditTargets } from "./edit-yaml";

const noPropsUnderCursorMessage = "There are no props under cursor";

export class LogEntryEditor {
  private targetFor = (task: LogTimeBlock) =>
    task.source === "frontmatterLog"
      ? this.targets.inFrontmatter(task.path)
      : this.targets.inListItemProps(task.path, task.position.start.line);

  clockIn = (task: LogTimeBlock) =>
    editYaml(this.targetFor(task), requireProps(addOpenClock));

  clockOut = (task: LogTimeBlock) =>
    editYaml(this.targetFor(task), requireProps(clockOut));

  cancelClock = (task: LogTimeBlock) =>
    editYaml(this.targetFor(task), requireProps(cancelOpenClock));

  editLastClock = (
    task: LogTimeBlock,
    patch: { start?: string; end?: string },
  ) =>
    editYaml(
      this.targetFor(task),
      requireProps((props) => editLastLogEntry(props, patch)),
    );

  clockInUnderCursor = () =>
    editYaml(this.targets.underCursor(), addOpenClockOrCreateProps);

  clockOutUnderCursor = () =>
    editYaml(
      this.targets.underCursor(),
      requireProps(clockOut, noPropsUnderCursorMessage),
    );

  cancelClockUnderCursor = () =>
    editYaml(
      this.targets.underCursor(),
      requireProps(cancelOpenClock, noPropsUnderCursorMessage),
    );

  constructor(private readonly targets: YamlEditTargets) {}
}
