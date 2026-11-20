import {
  normalizePath,
  Notice,
  TFile,
  TFolder,
  type FileManager,
  type MetadataCache,
  type Vault,
} from "obsidian";

import type { DayPlannerSettings } from "../settings";
import type { RemoteTimeBlock } from "../time-block-types";
import {
  addLineUnderHeading,
  createMeetingNoteContents,
  createMeetingNotePath,
  getMeetingId,
  getMeetingProperties,
  getMeetingTimeRange,
  meetingIdKey,
  type MeetingNoteIndex,
  mergeMeetingProperties,
  removeFromMeetingNoteIndex,
  renameInMeetingNoteIndex,
  renderMeetingTemplate,
} from "../util/meeting-note";

import type { PeriodicNotes } from "./periodic-notes";
import type { WorkspaceFacade } from "./workspace-facade";

export type MeetingNotes = ReturnType<typeof createMeetingNotes>;

/**
 * Creates and opens notes for calendar events. A meeting note lives in its own
 * folder and is linked both ways with the daily note of the event's day.
 * Notes are tracked in an index in settings, so they can be renamed or moved.
 */
export function createMeetingNotes(props: {
  vault: Vault;
  metadataCache: MetadataCache;
  fileManager: FileManager;
  periodicNotes: PeriodicNotes;
  workspaceFacade: WorkspaceFacade;
  getSettings: () => DayPlannerSettings;
  updateSettings: (patch: Partial<DayPlannerSettings>) => void;
}) {
  const {
    vault,
    metadataCache,
    fileManager,
    periodicNotes,
    workspaceFacade,
    getSettings,
    updateSettings,
  } = props;

  function getIndex(): MeetingNoteIndex {
    return getSettings().meetingNoteIndex ?? {};
  }

  function setIndex(meetingNoteIndex: MeetingNoteIndex) {
    updateSettings({ meetingNoteIndex });
  }

  function remember(meetingId: string, path: string) {
    if (getIndex()[meetingId] !== path) {
      setIndex({ ...getIndex(), [meetingId]: path });
    }
  }

  function getIdInFrontmatter(file: TFile): unknown {
    return metadataCache.getFileCache(file)?.frontmatter?.[meetingIdKey];
  }

  function getMeetingNotePath(timeBlock: RemoteTimeBlock) {
    return normalizePath(
      createMeetingNotePath(timeBlock, getSettings().meetingNotesFolder),
    );
  }

  function findByIndex(meetingId: string) {
    const indexedPath = getIndex()[meetingId];
    const indexed = indexedPath
      ? vault.getAbstractFileByPath(indexedPath)
      : null;

    return indexed instanceof TFile ? indexed : undefined;
  }

  function findByFrontmatter(meetingId: string) {
    return vault
      .getMarkdownFiles()
      .find((file) => getIdInFrontmatter(file) === meetingId);
  }

  function findByDefaultPath(timeBlock: RemoteTimeBlock, meetingId: string) {
    const defaultPath = getMeetingNotePath(timeBlock);
    const file = vault.getAbstractFileByPath(defaultPath);

    if (!(file instanceof TFile)) {
      return undefined;
    }

    // A note with the same name might belong to another event on the same day
    const idInFile = getIdInFrontmatter(file);
    const claimedByAnotherMeeting =
      (idInFile !== undefined && idInFile !== meetingId) ||
      Object.entries(getIndex()).some(
        ([id, path]) => path === defaultPath && id !== meetingId,
      );

    return claimedByAnotherMeeting ? undefined : file;
  }

  function findMeetingNote(timeBlock: RemoteTimeBlock): TFile | undefined {
    const meetingId = getMeetingId(timeBlock);
    const indexed = findByIndex(meetingId);

    if (indexed) {
      return indexed;
    }

    const found =
      findByFrontmatter(meetingId) ?? findByDefaultPath(timeBlock, meetingId);

    if (found) {
      remember(meetingId, found.path);
    }

    return found;
  }

  function getAvailablePath(timeBlock: RemoteTimeBlock) {
    const path = getMeetingNotePath(timeBlock);

    if (!vault.getAbstractFileByPath(path)) {
      return path;
    }

    const withTime = `${path.replace(/\.md$/, "")} ${timeBlock.startTime.format("HHmm")}`;

    for (let i = 0; ; i++) {
      const candidate = i === 0 ? `${withTime}.md` : `${withTime} ${i}.md`;

      if (!vault.getAbstractFileByPath(candidate)) {
        return candidate;
      }
    }
  }

  async function ensureFolderExists(filePath: string) {
    const folderPath = filePath.split("/").slice(0, -1).join("/");

    if (!folderPath) {
      return;
    }

    const existing = vault.getAbstractFileByPath(folderPath);

    if (existing instanceof TFolder) {
      return;
    }

    if (existing) {
      throw new Error(`${folderPath} exists, but it's not a folder`);
    }

    await vault.createFolder(folderPath);
  }

  /**
   * Returns the contents of the template from settings, or `undefined` when
   * no template is set. A missing template falls back to the default layout.
   */
  async function readTemplate() {
    const templatePath = getSettings().meetingNoteTemplate.trim();

    if (!templatePath) {
      return undefined;
    }

    const file = vault.getAbstractFileByPath(
      normalizePath(
        templatePath.endsWith(".md") ? templatePath : `${templatePath}.md`,
      ),
    );

    if (!(file instanceof TFile)) {
      new Notice(
        `Meeting note template "${templatePath}" not found, using the default layout`,
      );

      return undefined;
    }

    return vault.read(file);
  }

  async function createFromTemplate(props: {
    path: string;
    template: string;
    timeBlock: RemoteTimeBlock;
    dailyNoteLinkText?: string;
  }) {
    const { path, template, timeBlock, dailyNoteLinkText } = props;
    const noteTitle = path.split("/").pop()?.replace(/\.md$/, "") ?? "";

    const file = await vault.create(
      path,
      renderMeetingTemplate(template, {
        timeBlock,
        timestampFormat: getSettings().timestampFormat,
        noteTitle,
        dailyNoteLinkText,
      }),
    );

    // The default properties are always added, so that notes with and
    // without a template have the same basic metadata
    await fileManager.processFrontMatter(file, (frontmatter) =>
      mergeMeetingProperties(
        frontmatter,
        getMeetingProperties({ timeBlock, dailyNoteLinkText }),
      ),
    );

    return file;
  }

  async function linkFromDailyNote(props: {
    dailyNote: TFile;
    meetingNote: TFile;
    timeBlock: RemoteTimeBlock;
  }) {
    const { dailyNote, meetingNote, timeBlock } = props;
    const settings = getSettings();

    const linkText = metadataCache.fileToLinktext(
      meetingNote,
      dailyNote.path,
      true,
    );
    const alias = `${getMeetingTimeRange(timeBlock, settings.timestampFormat)} ${timeBlock.summary}`;
    const line = `- [[${linkText}|${alias.replace(/[|[\]]/g, " ")}]]`;

    await vault.process(dailyNote, (contents) =>
      addLineUnderHeading({
        contents,
        heading: settings.meetingNotesHeading,
        headingLevel: settings.plannerHeadingLevel,
        line,
        dedupeKey: `[[${linkText}`,
      }),
    );
  }

  async function createMeetingNote(timeBlock: RemoteTimeBlock) {
    const settings = getSettings();
    const path = getAvailablePath(timeBlock);

    await ensureFolderExists(path);

    const dailyNote = settings.meetingNotesLinkInDailyNote
      ? await periodicNotes.createDailyNoteIfNeeded(timeBlock.startTime)
      : undefined;
    const dailyNoteLinkText = dailyNote
      ? metadataCache.fileToLinktext(dailyNote, path, true)
      : undefined;

    const template = await readTemplate();
    const meetingNote =
      template === undefined
        ? await vault.create(
            path,
            createMeetingNoteContents({
              timeBlock,
              timestampFormat: settings.timestampFormat,
              dailyNoteLinkText,
            }),
          )
        : await createFromTemplate({
            path,
            template,
            timeBlock,
            dailyNoteLinkText,
          });

    remember(getMeetingId(timeBlock), meetingNote.path);

    if (dailyNote) {
      await linkFromDailyNote({ dailyNote, meetingNote, timeBlock });
    }

    return meetingNote;
  }

  return {
    async openOrCreateMeetingNote(timeBlock: RemoteTimeBlock) {
      const file =
        findMeetingNote(timeBlock) ?? (await createMeetingNote(timeBlock));

      await workspaceFacade.openFileInEditor(file);

      return file;
    },

    handleRename(oldPath: string, newPath: string) {
      const next = renameInMeetingNoteIndex(getIndex(), oldPath, newPath);

      if (JSON.stringify(next) !== JSON.stringify(getIndex())) {
        setIndex(next);
      }
    },

    handleDelete(path: string) {
      const next = removeFromMeetingNoteIndex(getIndex(), path);

      if (Object.keys(next).length !== Object.keys(getIndex()).length) {
        setIndex(next);
      }
    },
  };
}
