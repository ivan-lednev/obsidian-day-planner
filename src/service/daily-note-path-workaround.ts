import type { Moment } from "moment";
import { normalizePath } from "obsidian";

/**
 * WORKAROUND: temporary, remove when the dependency supports subdirectories.
 *
 * `obsidian-daily-notes-interface` parses a note's date from its *basename*,
 * against only the last segment of the daily note format (see its
 * `getDateFromFilename`). When the format encodes date parts in folders, e.g.
 * `YYYY/[Daily]/MM-MMM/DD-ddd`, the folder parts are dropped. Notes with the
 * same basename in different folders (`2023/Daily/11-Nov/22-Wed.md` and
 * `2023/Daily/02-Feb/22-Wed.md`) then collapse onto the same date, so the
 * plugin reads/opens the wrong file.
 *
 * Upstream issue: https://github.com/liamcain/obsidian-daily-notes-interface/issues/21
 * Upstream fix (unmerged): https://github.com/liamcain/obsidian-daily-notes-interface/pull/34
 *
 * TODO: delete this module and revert `PeriodicNotes` to pass through to the
 * dependency once a release includes subdirectory support.
 */

export function getFolderPrefix(folder?: string) {
  const normalized = normalizePath(folder ?? "");

  if (!normalized || normalized === ".") {
    return "";
  }

  return `${normalized}/`;
}

export function getDateFromDailyNotePathWorkaround(props: {
  path: string;
  format: string;
  folder?: string;
}): Moment | null {
  const { path, format, folder } = props;

  const prefix = getFolderPrefix(folder);
  const withoutExtension = normalizePath(path).replace(/\.md$/i, "");

  if (prefix && !withoutExtension.startsWith(prefix)) {
    return null;
  }

  const relativeToFolder = withoutExtension.slice(prefix.length);
  const date = window.moment(relativeToFolder, format, true);

  return date.isValid() ? date : null;
}
