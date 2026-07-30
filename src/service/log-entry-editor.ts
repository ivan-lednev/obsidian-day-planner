import type { Pos } from "obsidian";

import {
  addOpenClockOrCreateProps,
  cancelOpenClock,
  clockOut,
  deleteLogEntry,
  editLastLogEntry,
  editLogEntry,
} from "../util/props";

import { editYaml, requireProps, type YamlEditTargets } from "./edit-yaml";

const noPropsUnderCursorMessage = "There are no props under cursor";

// A location has a position when it's a list item on a specific line; when it's
// missing, the location is a whole file's frontmatter.
export interface ClockLocation {
  path: string;
  position?: Pos;
}

export class LogEntryEditor {
  private targetFor = (location: ClockLocation) =>
    location.position
      ? this.targets.inListItemProps(
          location.path,
          location.position.start.line,
        )
      : this.targets.inFrontmatter(location.path);

  clockIn = (location: ClockLocation) =>
    editYaml(this.targetFor(location), addOpenClockOrCreateProps);

  clockOut = (location: ClockLocation) =>
    editYaml(this.targetFor(location), requireProps(clockOut));

  cancelClock = (location: ClockLocation) =>
    editYaml(this.targetFor(location), requireProps(cancelOpenClock));

  deleteClock = (location: ClockLocation, originalStart: string) =>
    editYaml(
      this.targetFor(location),
      requireProps((props) => deleteLogEntry(props, originalStart)),
    );

  editClock = (
    location: ClockLocation,
    args: { originalStart: string; patch: { start?: string; end?: string } },
  ) =>
    editYaml(
      this.targetFor(location),
      requireProps((props) => editLogEntry(props, args)),
    );

  editLastClock = (
    location: ClockLocation,
    patch: { start?: string; end?: string },
  ) =>
    editYaml(
      this.targetFor(location),
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
