import type { Moment } from "moment";
import { normalizePath } from "obsidian";

export function getFolderPrefix(folder?: string) {
  const normalized = normalizePath(folder ?? "");

  if (!normalized || normalized === ".") {
    return "";
  }

  return `${normalized}/`;
}

/**
 * Parses the date out of a daily note path.
 *
 * Unlike `obsidian-daily-notes-interface`, it parses the whole path relative to
 * the daily notes folder against the whole format. This matters when the format
 * encodes parts of the date in folders, e.g.
 * `YYYY/[Daily]/MM-MMM/DD-ddd` for `2023/Daily/11-Nov/22-Wed.md`. Parsing only
 * the basename (`22-Wed` with `DD-ddd`) drops the year and month, so distinct
 * notes collapse onto the same date.
 */
export function getDateFromDailyNotePath(props: {
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
