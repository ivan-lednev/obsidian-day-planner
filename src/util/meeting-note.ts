import type { RemoteTimeBlock } from "../time-block-types";

import { getPhysicalLocation } from "./ical-meeting-details";
import { createHeading } from "./markdown";

// Local copies to keep this module free of Obsidian imports (and testable)
function isWithDuration(
  timeBlock: RemoteTimeBlock,
): timeBlock is RemoteTimeBlock & { durationMinutes: number } {
  return Object.hasOwn(timeBlock, "durationMinutes");
}

function getEndTime(timeBlock: RemoteTimeBlock & { durationMinutes: number }) {
  return timeBlock.startTime.clone().add(timeBlock.durationMinutes, "minutes");
}

/**
 * Pure helpers for meeting notes: notes created from calendar (iCal) events.
 * Everything that touches the vault lives in `service/meeting-notes.ts`.
 */

export const meetingIdKey = "meeting-id";
const dailyNoteKey = "daily-note";
const meetingLinkKey = "meeting-link";

const meetingDateFormat = "YYYY-MM-DD";

/**
 * A key that survives re-syncs. The iCal UID is shared between occurrences of
 * a recurring event, so the date is appended. Events without a UID fall back
 * to their summary and start time.
 */
export function getMeetingId(timeBlock: RemoteTimeBlock) {
  const date = timeBlock.startTime.format(meetingDateFormat);
  const base =
    timeBlock.uid?.trim() ||
    `${timeBlock.summary}@${timeBlock.startTime.format("HH:mm")}`;

  return `${base}/${date}`;
}

const forbiddenFileNameCharacters = /[\\/:*?"<>|#^[\]]/g;

export function sanitizeFileName(text: string) {
  return text
    .replace(forbiddenFileNameCharacters, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\.+/, "")
    .slice(0, 120)
    .trim();
}

export function createMeetingNotePath(
  timeBlock: RemoteTimeBlock,
  folder: string,
) {
  const date = timeBlock.startTime.format(meetingDateFormat);
  const name = sanitizeFileName(timeBlock.summary) || "Meeting";
  const fileName = `${date} ${name}.md`;
  const cleanFolder = folder
    .split("/")
    .filter((part) => part.length > 0 && part !== ".")
    .join("/");

  return cleanFolder ? `${cleanFolder}/${fileName}` : fileName;
}

export function getMeetingTimeRange(
  timeBlock: RemoteTimeBlock,
  timestampFormat: string,
) {
  if (timeBlock.isAllDayEvent) {
    return "All day";
  }

  const start = timeBlock.startTime.format(timestampFormat);

  if (!isWithDuration(timeBlock)) {
    return start;
  }

  return `${start} - ${getEndTime(timeBlock).format(timestampFormat)}`;
}

function yamlString(value: string) {
  // JSON strings are valid YAML double-quoted scalars
  return JSON.stringify(value);
}

/**
 * iCal descriptions often come as HTML (Google, Outlook). Keep the text,
 * drop the markup.
 */
export function descriptionToMarkdown(description: string) {
  return description
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * A value for Obsidian's "Date & time" property type: the start of the
 * meeting. All-day events get a plain date.
 */
export function getDateProperty(timeBlock: RemoteTimeBlock) {
  return timeBlock.isAllDayEvent
    ? timeBlock.startTime.format(meetingDateFormat)
    : timeBlock.startTime.format("YYYY-MM-DDTHH:mm");
}

/**
 * The length of the meeting in minutes. A number, so it can be filtered and
 * sorted on. All-day events don't get one.
 */
export function getDurationProperty(timeBlock: RemoteTimeBlock) {
  if (timeBlock.isAllDayEvent || !isWithDuration(timeBlock)) {
    return undefined;
  }

  return Math.round(timeBlock.durationMinutes);
}

/** 90 -> "1h 30m", 45 -> "45m", 120 -> "2h" */
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest}m`;
  }

  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

type MeetingProperties = Record<string, string | number | string[]>;

/**
 * The properties every meeting note gets by default: the title, the meeting
 * ID, where the meeting happens and the daily note. Everything else can come from a
 * template. Missing details are left out.
 */
export function getMeetingProperties(props: {
  timeBlock: RemoteTimeBlock;
  dailyNoteLinkText?: string;
}): MeetingProperties {
  const { timeBlock, dailyNoteLinkText } = props;

  const result: MeetingProperties = {
    title: timeBlock.summary,
    [meetingIdKey]: getMeetingId(timeBlock),
  };

  const physicalLocation = getPhysicalLocation(timeBlock.location);

  if (physicalLocation) {
    result.location = physicalLocation;
  }

  if (timeBlock.onlineMeetingUrl) {
    result[meetingLinkKey] = timeBlock.onlineMeetingUrl;
  }

  if (dailyNoteLinkText) {
    result[dailyNoteKey] = `[[${dailyNoteLinkText}]]`;
  }

  return result;
}

const dateLikeRegExp = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;

function yamlScalar(key: string, value: string | number) {
  if (typeof value === "number") {
    return String(value);
  }

  // Dates stay unquoted, so that YAML and Obsidian see them as dates
  return key === "date" && dateLikeRegExp.test(value)
    ? value
    : yamlString(value);
}

function serializeFrontmatter(properties: MeetingProperties) {
  const lines = Object.entries(properties).flatMap(([key, value]) =>
    Array.isArray(value)
      ? [
          `${key}:`,
          // Tags are plain words, the rest might contain YAML syntax
          ...value.map(
            (item) => `  - ${key === "tags" ? item : yamlString(item)}`,
          ),
        ]
      : [`${key}: ${yamlScalar(key, value)}`],
  );

  return ["---", ...lines, "---"].join("\n");
}

/**
 * Adds meeting properties to existing frontmatter (e.g. from a template).
 * Tags are merged, everything else is overwritten.
 */
export function mergeMeetingProperties(
  frontmatter: Record<string, unknown>,
  properties: MeetingProperties,
) {
  for (const [key, value] of Object.entries(properties)) {
    if (key === "tags" && Array.isArray(value)) {
      const existing = frontmatter.tags;
      const existingTags =
        typeof existing === "string"
          ? existing.split(/[,\s]+/).filter(Boolean)
          : Array.isArray(existing)
            ? existing.map(String)
            : [];

      frontmatter.tags = [...new Set([...existingTags, ...value])];
    } else {
      frontmatter[key] = value;
    }
  }
}

function getTemplateVariables(props: {
  timeBlock: RemoteTimeBlock;
  timestampFormat: string;
  noteTitle: string;
  dailyNoteLinkText?: string;
}): Record<string, (format?: string) => string> {
  const { timeBlock, timestampFormat, noteTitle, dailyNoteLinkText } = props;
  const attendees = timeBlock.attendees ?? [];
  const end = isWithDuration(timeBlock) ? getEndTime(timeBlock) : undefined;

  return {
    title: () => noteTitle,
    summary: () => timeBlock.summary,
    "meeting-id": () => getMeetingId(timeBlock),
    date: (format) => timeBlock.startTime.format(format || meetingDateFormat),
    time: (format) => timeBlock.startTime.format(format || timestampFormat),
    start: (format) => timeBlock.startTime.format(format || timestampFormat),
    end: (format) => end?.format(format || timestampFormat) ?? "",
    "duration-minutes": () => String(getDurationProperty(timeBlock) ?? ""),
    duration: () => {
      const minutes = getDurationProperty(timeBlock);

      return minutes === undefined ? "" : formatDuration(minutes);
    },
    "time-range": () => getMeetingTimeRange(timeBlock, timestampFormat),
    calendar: () => timeBlock.calendar.name,
    location: () => getPhysicalLocation(timeBlock.location) ?? "",
    "meeting-link": () => timeBlock.onlineMeetingUrl ?? "",
    attendees: () => attendees.join(", "),
    "attendee-list": () => attendees.map((it) => `- ${it}`).join("\n"),
    description: () =>
      timeBlock.description ? descriptionToMarkdown(timeBlock.description) : "",
    "daily-note": () => (dailyNoteLinkText ? `[[${dailyNoteLinkText}]]` : ""),
  };
}

/**
 * Replaces `{{variable}}` and `{{variable:format}}` in a template, like core
 * Templates does. Unknown variables are left alone, so that other template
 * engines (e.g. Templater) can still process the note.
 */
export function renderMeetingTemplate(
  template: string,
  props: {
    timeBlock: RemoteTimeBlock;
    timestampFormat: string;
    noteTitle: string;
    dailyNoteLinkText?: string;
  },
) {
  const variables = getTemplateVariables(props);

  return template.replace(
    /\{\{\s*([\w-]+)\s*(?::([^}]*))?\}\}/g,
    (match, name: string, format?: string) => {
      const variable = variables[name.toLowerCase()];

      return variable ? variable(format?.trim()) : match;
    },
  );
}

export function createMeetingNoteContents(props: {
  timeBlock: RemoteTimeBlock;
  timestampFormat: string;
  /** Link text for the daily note, without brackets, e.g. `2026-11-19` */
  dailyNoteLinkText?: string;
}) {
  const { timeBlock, timestampFormat, dailyNoteLinkText } = props;

  const frontmatter = serializeFrontmatter(
    getMeetingProperties({ timeBlock, dailyNoteLinkText }),
  );
  const physicalLocation = getPhysicalLocation(timeBlock.location);

  const details = [
    `**When:** ${timeBlock.startTime.format(meetingDateFormat)}, ${getMeetingTimeRange(timeBlock, timestampFormat)}`,
  ];

  if (physicalLocation) {
    details.push(`**Where:** ${physicalLocation}`);
  }

  if (timeBlock.onlineMeetingUrl) {
    details.push(`**Join:** <${timeBlock.onlineMeetingUrl}>`);
  }

  if (dailyNoteLinkText) {
    details.push(`**Daily note:** [[${dailyNoteLinkText}]]`);
  }

  const sections = [frontmatter, `# ${timeBlock.summary}`, details.join("\n")];

  const description = timeBlock.description
    ? descriptionToMarkdown(timeBlock.description)
    : "";

  if (description) {
    sections.push(`## Agenda\n\n${description}`);
  }

  sections.push("## Notes\n\n- ");
  sections.push("## Action items\n\n- [ ] ");

  return sections.join("\n\n") + "\n";
}

const headingRegExp = /^(#{1,6})\s+(.*?)\s*#*\s*$/;

function parseHeading(line: string) {
  const match = line.match(headingRegExp);

  if (!match?.[1]) {
    return undefined;
  }

  return { level: match[1].length, text: match[2] ?? "" };
}

/**
 * Adds `line` as the last item under `heading` in `contents`. Creates the
 * heading at the end of the file if it's missing. Does nothing if a line
 * containing `dedupeKey` is already present under the heading.
 */
export function addLineUnderHeading(props: {
  contents: string;
  heading: string;
  headingLevel: number;
  line: string;
  dedupeKey?: string;
}) {
  const { contents, heading, headingLevel, line, dedupeKey } = props;
  const lines = contents.split("\n");

  const headingIndex = lines.findIndex(
    (it) => parseHeading(it)?.text.trim() === heading.trim(),
  );

  if (headingIndex === -1) {
    const trimmed = contents.trimEnd();
    const prefix = trimmed.length > 0 ? `${trimmed}\n\n` : "";

    return `${prefix}${createHeading(headingLevel, heading)}\n\n${line}\n`;
  }

  const ownLevel = parseHeading(lines[headingIndex] ?? "")?.level ?? 1;

  let sectionEnd = lines.length;

  for (let i = headingIndex + 1; i < lines.length; i++) {
    const parsed = parseHeading(lines[i] ?? "");

    if (parsed && parsed.level <= ownLevel) {
      sectionEnd = i;
      break;
    }
  }

  const section = lines.slice(headingIndex + 1, sectionEnd);

  if (dedupeKey && section.some((it) => it.includes(dedupeKey))) {
    return contents;
  }

  // Insert after the last non-empty line of the section
  let insertAt = headingIndex + 1;

  for (let i = sectionEnd - 1; i > headingIndex; i--) {
    if ((lines[i] ?? "").trim().length > 0) {
      insertAt = i + 1;
      break;
    }
  }

  const toInsert = insertAt === headingIndex + 1 ? ["", line] : [line];
  const needsTrailingBlank =
    insertAt < lines.length && (lines[insertAt] ?? "").trim().length > 0;

  if (needsTrailingBlank) {
    toInsert.push("");
  }

  return [
    ...lines.slice(0, insertAt),
    ...toInsert,
    ...lines.slice(insertAt),
  ].join("\n");
}

export type MeetingNoteIndex = Record<string, string>;

function movePath(path: string, oldPath: string, newPath: string) {
  if (path === oldPath) {
    return newPath;
  }

  if (path.startsWith(`${oldPath}/`)) {
    return newPath + path.slice(oldPath.length);
  }

  return path;
}

/** Follows a renamed note, or a renamed folder with notes in it */
export function renameInMeetingNoteIndex(
  index: MeetingNoteIndex,
  oldPath: string,
  newPath: string,
): MeetingNoteIndex {
  return Object.fromEntries(
    Object.entries(index).map(([id, path]) => [
      id,
      movePath(path, oldPath, newPath),
    ]),
  );
}

/** Forgets a deleted note, or notes in a deleted folder */
export function removeFromMeetingNoteIndex(
  index: MeetingNoteIndex,
  deletedPath: string,
): MeetingNoteIndex {
  return Object.fromEntries(
    Object.entries(index).filter(
      ([, path]) => path !== deletedPath && !path.startsWith(`${deletedPath}/`),
    ),
  );
}
