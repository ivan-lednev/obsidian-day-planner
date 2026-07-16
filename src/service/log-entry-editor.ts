import type { Pos } from "obsidian";

import {
  addOpenClock,
  addOpenClockOrCreateProps,
  cancelOpenClock,
  clockOut,
  editLastLogEntry,
} from "../util/props";

import { editYaml, requireProps, type YamlEditTargets } from "./edit-yaml";

const noPropsUnderCursorMessage = "There are no props under cursor";

// A location has a position when it's a task on a specific line; when it's
// missing, the location is a whole file's frontmatter.
export interface ClockLocation {
  path: string;
  position?: Pos;
}

export class LogEntryEditor {
  private targetFor = (task: ClockLocation) =>
    task.position
      ? this.targets.inListItemProps(task.path, task.position.start.line)
      : this.targets.inFrontmatter(task.path);

  clockIn = (task: ClockLocation) =>
    editYaml(this.targetFor(task), requireProps(addOpenClock));

  clockOut = (task: ClockLocation) =>
    editYaml(this.targetFor(task), requireProps(clockOut));

  cancelClock = (task: ClockLocation) =>
    editYaml(this.targetFor(task), requireProps(cancelOpenClock));

  editLastClock = (
    task: ClockLocation,
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
