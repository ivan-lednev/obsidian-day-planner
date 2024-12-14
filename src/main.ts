import {
  MarkdownView,
  Notice,
  Plugin,
  WorkspaceLeaf,
  type MarkdownFileInfo,
} from "obsidian";
import {
  createDailyNote,
  getDateFromPath,
} from "obsidian-daily-notes-interface";
import { getAPI, type STask } from "obsidian-dataview";
import { mount } from "svelte";
import { fromStore, get, writable, type Writable } from "svelte/store";
import { isInstanceOf, isNotVoid } from "typed-assert";

import {
  errorContextKey,
  obsidianContextKey,
  viewTypeReleaseNotes,
  viewTypeTimeline,
  viewTypeMultiDay,
} from "./constants";
import { currentTime } from "./global-store/current-time";
import { settings } from "./global-store/settings";
import {
  compareByTimestampInText,
  fromMarkdown,
  positionContainsPoint,
  sortListsRecursively,
  sortListsRecursivelyInMarkdown,
  toEditorPos,
  toMarkdown,
  toMdastPoint,
} from "./mdast/mdast";
import { DataviewFacade } from "./service/dataview-facade";
import {
  applyScopedUpdates,
  createTransaction,
  getTaskDiffFromEditState,
  mapTaskDiffToUpdates,
  TransactionWriter,
} from "./service/diff-writer";
import { STaskEditor } from "./service/stask-editor";
import { VaultFacade } from "./service/vault-facade";
import { WorkspaceFacade } from "./service/workspace-facade";
import { type DayPlannerSettings, defaultSettings } from "./settings";
import { createGetTasksApi } from "./tasks-plugin";
import type { ObsidianContext, OnUpdateFn } from "./types";
import StatusBarWidget from "./ui/components/status-bar-widget.svelte";
import { askForConfirmation } from "./ui/confirmation-modal";
import { EditMode } from "./ui/hooks/use-edit/types";
import MultiDayView from "./ui/multi-day-view";
import { DayPlannerReleaseNotesView } from "./ui/release-notes";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import { SingleSuggestModal } from "./ui/SingleSuggestModal";
import TimelineView from "./ui/timeline-view";
import { createUndoNotice } from "./ui/undo-notice";
import * as c from "./util/clock";
import { createHooks } from "./util/create-hooks.svelte";
import { createRenderMarkdown } from "./util/create-render-markdown";
import { createShowPreview } from "./util/create-show-preview";
import { createDailyNoteIfNeeded } from "./util/daily-notes";
import { notifyAboutStartedTasks } from "./util/notify-about-started-tasks";
import { getUpdateTrigger } from "./util/store";

export default class DayPlanner extends Plugin {
  settings!: () => DayPlannerSettings;
  private settingsStore!: Writable<DayPlannerSettings>;
  private workspaceFacade!: WorkspaceFacade;
  private dataviewFacade!: DataviewFacade;
  private sTaskEditor!: STaskEditor;
  private vaultFacade!: VaultFacade;
  private transationWriter!: TransactionWriter;
  private syncDataview?: () => void;
  private currentUndoNotice?: Notice;

  async onload() {
    await this.initSettingsStore();

    const getTasksApi = createGetTasksApi(this.app);

    this.vaultFacade = new VaultFacade(this.app.vault, getTasksApi);
    this.transationWriter = new TransactionWriter(this.vaultFacade);
    this.workspaceFacade = new WorkspaceFacade(
      this.app.workspace,
      this.vaultFacade,
    );
    this.dataviewFacade = new DataviewFacade(() => getAPI(this.app));
    this.sTaskEditor = new STaskEditor(
      this.workspaceFacade,
      this.vaultFacade,
      this.dataviewFacade,
    );

    this.registerViews();
    this.registerCommands();

    this.addRibbonIcon(
      "calendar-range",
      "Open Timeline",
      this.initTimelineLeaf,
    );
    this.addRibbonIcon("table-2", "Open Multi-Day View", this.initWeeklyLeaf);
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    await this.handleNewPluginVersion();
    await this.initTimelineLeafSilently();
  }

  async onunload() {
    return Promise.all([
      this.detachLeavesOfType(viewTypeTimeline),
      this.detachLeavesOfType(viewTypeMultiDay),
    ]);
  }

  initWeeklyLeaf = async () => {
    await this.app.workspace.getLeaf("tab").setViewState({
      type: viewTypeMultiDay,
      active: true,
    });
  };

  initTimelineLeafSilently = async () => {
    this.app.workspace.onLayoutReady(async () => {
      const [firstExistingTimeline] =
        this.app.workspace.getLeavesOfType(viewTypeTimeline);
      if (firstExistingTimeline) {
        return;
      }

      await this.detachLeavesOfType(viewTypeTimeline);

      await this.app.workspace.getRightLeaf(false)?.setViewState({
        type: viewTypeTimeline,
      });
    });
  };

  initTimelineLeaf = async () => {
    const [firstExistingTimeline] =
      this.app.workspace.getLeavesOfType(viewTypeTimeline);

    if (firstExistingTimeline) {
      this.app.workspace.revealLeaf(firstExistingTimeline);
      return;
    }

    await this.detachLeavesOfType(viewTypeTimeline);
    await this.app.workspace.getRightLeaf(false)?.setViewState({
      type: viewTypeTimeline,
      active: true,
    });
    this.app.workspace.rightSplit.expand();
  };

  private async handleNewPluginVersion() {
    if (this.settings().pluginVersion === currentPluginVersion) {
      return;
    }

    this.settingsStore.update((previous) => ({
      ...previous,
      pluginVersion: currentPluginVersion,
    }));

    if (this.settings().releaseNotes) {
      this.app.workspace.onLayoutReady(async () => {
        await this.showReleaseNotes();
      });
    }
  }

  private registerCommands() {
    this.addCommand({
      id: "show-day-planner-timeline",
      name: "Show timeline",
      callback: async () => await this.initTimelineLeaf(),
    });

    this.addCommand({
      id: "show-weekly-view",
      name: "Show week planner",
      callback: this.initWeeklyLeaf,
    });

    this.addCommand({
      id: "show-multi-day-view",
      name: "Show multi-day planner",
      callback: this.initWeeklyLeaf,
    });

    this.addCommand({
      id: "show-day-planner-today-note",
      name: "Open today's Day Planner",
      callback: async () => {
        const dailyNote = await createDailyNoteIfNeeded(window.moment());

        await this.app.workspace.getLeaf(false).openFile(dailyNote);
      },
    });

    this.addCommand({
      id: "reorder-tasks-by-time",
      name: "Sort tasks under cursor by time",
      editorCallback: (editor) => {
        const mdastRoot = fromMarkdown(editor.getValue());
        const cursorPoint = toMdastPoint(editor.getCursor());

        // todo: move out
        const list = mdastRoot.children.find(
          (rootContent) =>
            rootContent.position &&
            positionContainsPoint(rootContent.position, cursorPoint),
        );

        if (!list) {
          new Notice("There is no list under cursor");

          return;
        }

        const sorted = sortListsRecursively(list, compareByTimestampInText);
        const updatedText = toMarkdown(sorted).trim();

        isNotVoid(sorted.position);

        editor.replaceRange(
          updatedText,
          toEditorPos(sorted.position.start),
          toEditorPos(sorted.position.end),
        );
      },
    });

    this.addCommand({
      id: "clock-in",
      icon: "play",
      name: "Clock in",
      // @ts-expect-error
      editorCallback: this.sTaskEditor.clockInUnderCursor,
    });

    this.addCommand({
      icon: "square",
      id: "clock-out",
      name: "Clock out",
      editorCallback: this.sTaskEditor.clockOutUnderCursor,
    });

    this.addCommand({
      icon: "trash-2",
      id: "cancel-clock",
      name: "Cancel clock",
      // @ts-expect-error
      editorCallback: this.sTaskEditor.cancelClockUnderCursor,
    });
  }

  private async initSettingsStore() {
    const initialSettings = { ...defaultSettings, ...(await this.loadData()) };

    settings.set(initialSettings);

    this.register(
      settings.subscribe(async (newValue) => {
        await this.saveData(newValue);
      }),
    );

    this.settingsStore = settings;
    this.settings = () => get(settings);
  }

  private async detachLeavesOfType(type: string) {
    // Although this is synchronous, without wrapping into a promise, weird things happen:
    // - when re-initializing the weekly view, it gets deleted every other time instead of getting re-created
    // - or the tabs get hidden
    await this.app.workspace.detachLeavesOfType(type);
  }

  private showReleaseNotes = async () => {
    await this.app.workspace.getLeaf("tab").setViewState({
      type: viewTypeReleaseNotes,
      active: true,
    });
  };

  private getPathsToCreate(paths: string[]) {
    return paths.reduce<string[]>(
      (result, path) =>
        this.vaultFacade.checkFileExists(path) ? result : result.concat(path),
      [],
    );
  }

  private getSTaskUnderCursor = (view: MarkdownFileInfo) => {
    isInstanceOf(
      view,
      MarkdownView,
      "You can only get tasks from markdown editor views",
    );

    const file = view.file;

    isNotVoid(file, "There is no file for view");

    const sTask = this.dataviewFacade.getTaskAtLine({
      path: file.path,
      line: view.editor.getCursor().line,
    });

    isNotVoid(sTask, "There is no task under cursor");

    return sTask;
  };

  private registerViews() {
    const onEditCanceled = () => {
      new Notice("Edit canceled");

      // We need to manually reset tasks to the initial state
      this.syncDataview?.();
    };

    const onUpdate: OnUpdateFn = async (base, next, mode) => {
      const diff = getTaskDiffFromEditState(base, next);

      if (mode === EditMode.CREATE) {
        const created = diff.added[0];

        isNotVoid(created);

        const modalOutput: string | undefined = await new Promise((resolve) => {
          new SingleSuggestModal({
            app: this.app,
            getDescriptionText: (value) =>
              value.trim().length === 0
                ? "Start typing to create a task"
                : `Create item "${value}"`,
            onChooseSuggestion: async ({ text }) => {
              resolve(text);
            },
            onClose: () => {
              resolve(undefined);
            },
          }).open();
        });

        if (!modalOutput) {
          onEditCanceled();

          return;
        }

        diff.added[0] = { ...created, text: modalOutput };
      }

      const updates = mapTaskDiffToUpdates(diff, mode, this.settings());
      const afterEach = this.settings().sortTasksInPlanAfterEdit
        ? (contents: string) =>
            applyScopedUpdates(
              contents,
              this.settings().plannerHeading,
              sortListsRecursivelyInMarkdown,
            )
        : undefined;

      const transaction = createTransaction({
        updates,
        afterEach,
        settings: this.settings(),
      });

      const updatePaths = [
        ...new Set([...transaction.map(({ path }) => path)]),
      ];

      const needToCreate = this.getPathsToCreate(updatePaths);

      if (needToCreate.length > 0) {
        const confirmed = await askForConfirmation({
          app: this.app,
          title: "Need to create files",
          text: `The following files need to be created: ${needToCreate.join("; ")}`,
          cta: "Create",
        });

        if (!confirmed) {
          onEditCanceled();

          return;
        }

        await Promise.all(
          needToCreate.map(async (path) => {
            const date = getDateFromPath(path, "day");

            isNotVoid(date);

            await createDailyNote(date);
          }),
        );
      }

      await this.transationWriter.writeTransaction(transaction);

      this.currentUndoNotice?.hide();
      this.currentUndoNotice = createUndoNotice(this.transationWriter.undo);
    };

    const {
      editContext,
      tasksForToday,
      dataviewLoaded,
      isModPressed,
      newlyStartedTasks,
      icalSyncTrigger,
      isOnline,
      isDarkMode,
      dateRanges,
      dataviewSyncTrigger,
      search,
      pointerDateTime,
      tasksWithActiveClockProps,
      getDisplayedTasksWithClocksForTimeline,
    } = createHooks({
      app: this.app,
      dataviewFacade: this.dataviewFacade,
      workspaceFacade: this.workspaceFacade,
      settingsStore: this.settingsStore,
      onUpdate,
      currentTime,
    });

    this.syncDataview = () => dataviewSyncTrigger.set({});
    this.registerDomEvent(window, "blur", editContext.cancelEdit);
    this.registerDomEvent(document, "pointerup", editContext.cancelEdit);
    this.register(
      editContext.cursor.subscribe(({ bodyCursor }) => {
        document.body.style.cursor = bodyCursor;
      }),
    );

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        let sTask: STask | undefined;

        try {
          // todo: use editor instead?
          sTask = this.getSTaskUnderCursor(view);
        } catch {
          return;
        }

        menu.addSeparator();

        if (c.hasActiveClockProp(sTask)) {
          menu.addItem((item) => {
            item
              .setTitle("Clock out")
              .setIcon("square")
              .onClick(this.sTaskEditor.clockOutUnderCursor);
          });

          menu.addItem((item) => {
            item
              .setTitle("Cancel clock")
              .setIcon("trash")
              // @ts-expect-error
              .onClick(this.sTaskEditor.cancelClockUnderCursor);
          });
        } else {
          menu.addItem((item) => {
            item
              .setTitle("Clock in")
              .setIcon("play")
              // @ts-expect-error
              .onClick(this.sTaskEditor.clockInUnderCursor);
          });
        }
      }),
    );

    const errorStore = writable<Error | undefined>();

    mount(StatusBarWidget, {
      target: this.addStatusBarItem(),
      props: {
        onClick: this.initTimelineLeaf,
        tasksForToday,
        errorStore,
      },
    });

    this.register(
      newlyStartedTasks.subscribe((value) =>
        notifyAboutStartedTasks(value, this.settings()),
      ),
    );
    this.addCommand({
      id: "re-sync",
      name: "Re-sync tasks",
      callback: async () => {
        icalSyncTrigger.set(getUpdateTrigger());
      },
    });

    this.addCommand({
      id: "jump-to-active-clock",
      name: "Jump to active clock",
      callback: () => {
        const currentTasksWithActiveClockProps = get(tasksWithActiveClockProps);

        if (currentTasksWithActiveClockProps.length === 0) {
          new Notice("No active clocks found");

          return;
        }

        const firstTaskWithActiveClockProp =
          currentTasksWithActiveClockProps[0];

        const { location } = firstTaskWithActiveClockProp;

        isNotVoid(location);

        this.workspaceFacade.revealLineInFile(
          location.path,
          location.position?.start?.line,
        );
      },
    });

    //todo: show only in dev mode
    // this.addCommand({
    //   id: "dump-metadata",
    //   name: "Dump metadata to files",
    //   callback: createDumpMetadataCommand(this.app),
    // });

    const defaultObsidianContext: ObsidianContext = {
      search,
      sTaskEditor: this.sTaskEditor,
      workspaceFacade: this.workspaceFacade,
      initWeeklyView: this.initWeeklyLeaf,
      refreshTasks: this.dataviewFacade.legacy_getAllTasksFrom,
      dataviewLoaded,
      renderMarkdown: createRenderMarkdown(this.app),
      toggleCheckboxInFile: this.vaultFacade.toggleCheckboxInFile,
      editContext,
      showPreview: createShowPreview(this.app),
      isModPressed,
      reSync: () => icalSyncTrigger.set(getUpdateTrigger()),
      isOnline,
      isDarkMode,
      settings,
      settingsSignal: fromStore(settings),
      pointerDateTime,
      tasksWithActiveClockProps,
      getDisplayedTasksWithClocksForTimeline,
      // expandingControlsDefaultWidth,
    };

    const componentContext = new Map<
      string,
      ObsidianContext | typeof errorStore
    >([
      [obsidianContextKey, defaultObsidianContext],
      [errorContextKey, errorStore],
    ]);

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(leaf, this.settings, componentContext, dateRanges),
    );

    this.registerView(
      viewTypeMultiDay,
      (leaf: WorkspaceLeaf) =>
        new MultiDayView(
          leaf,
          this.settingsStore,
          componentContext,
          dateRanges,
        ),
    );

    this.registerView(
      viewTypeReleaseNotes,
      (leaf: WorkspaceLeaf) => new DayPlannerReleaseNotesView(leaf),
    );
  }
}
