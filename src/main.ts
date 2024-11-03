import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import {
  createDailyNote,
  getDateFromPath,
} from "obsidian-daily-notes-interface";
import { mount } from "svelte";
import { fromStore, get, writable, type Writable } from "svelte/store";
import { isNotVoid } from "typed-assert";

import {
  errorContextKey,
  obsidianContext,
  viewTypeReleaseNotes,
  viewTypeTimeline,
  viewTypeWeekly,
} from "./constants";
import { settings } from "./global-store/settings";
import {
  compareByTimestampInText,
  fromMarkdown,
  positionContainsPoint,
  sortListsRecursively,
  sortListsRecursivelyUnderHeading,
  toEditorPos,
  toMarkdown,
  toMdastPoint,
} from "./mdast/mdast";
import { DataviewFacade } from "./service/dataview-facade";
import {
  applyScopedUpdates,
  createTransaction,
  TransactionWriter,
} from "./service/diff-writer";
import { STaskEditor } from "./service/stask-editor";
import { VaultFacade } from "./service/vault-facade";
import { WorkspaceFacade } from "./service/workspace-facade";
import { type DayPlannerSettings, defaultSettings } from "./settings";
import type { LocalTask } from "./task-types";
import type { ObsidianContext } from "./types";
import StatusBarWidget from "./ui/components/status-bar-widget.svelte";
import { ConfirmationModal } from "./ui/confirmation-modal";
import MultiDayView from "./ui/multi-day-view";
import { DayPlannerReleaseNotesView } from "./ui/release-notes";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimelineView from "./ui/timeline-view";
import { createUndoNotice } from "./ui/undo-notice";
import { createHooks } from "./util/create-hooks.svelte";
import { createRenderMarkdown } from "./util/create-render-markdown";
import { createShowPreview } from "./util/create-show-preview";
import { createDailyNoteIfNeeded } from "./util/daily-notes";
import { notifyAboutStartedTasks } from "./util/notify-about-started-tasks";
import { getUpdateTrigger } from "./util/store";
import * as t from "./util/task-utils";
import {
  getTaskDiffFromEditState,
  mapTaskDiffToUpdates,
} from "./util/tasks-utils";

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

    this.vaultFacade = new VaultFacade(this.app.vault, this.getTasksApi);
    this.transationWriter = new TransactionWriter(this.vaultFacade);
    this.workspaceFacade = new WorkspaceFacade(
      this.app.workspace,
      this.vaultFacade,
    );
    this.dataviewFacade = new DataviewFacade(this.app);
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
      this.detachLeavesOfType(viewTypeWeekly),
    ]);
  }

  initWeeklyLeaf = async () => {
    await this.app.workspace.getLeaf("tab").setViewState({
      type: viewTypeWeekly,
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

  private getTasksApi = () => {
    // @ts-expect-error
    return this.app.plugins.plugins["obsidian-tasks-plugin"]?.apiV1;
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

  private askForConfirmation = async (props: {
    title: string;
    text: string;
    cta: string;
  }) => {
    return new Promise((resolve) => {
      new ConfirmationModal(this.app, {
        ...props,
        onAccept: async () => resolve(true),
        onCancel: () => resolve(false),
      }).open();
    });
  };

  private getPathsToCreate(paths: string[]) {
    return paths.reduce<string[]>(
      (result, path) =>
        this.vaultFacade.checkFileExists(path) ? result : result.concat(path),
      [],
    );
  }

  private registerViews() {
    const onUpdate = async (base: Array<LocalTask>, next: Array<LocalTask>) => {
      const nextWithUpdatedText = next.map(t.updateText);
      const diff = getTaskDiffFromEditState(base, nextWithUpdatedText);
      const updates = mapTaskDiffToUpdates(diff, this.settings());
      const afterEach = this.settings().sortTasksInPlanAfterEdit
        ? (contents: string) =>
            applyScopedUpdates(
              contents,
              this.settings().plannerHeading,
              (scoped) =>
                sortListsRecursivelyUnderHeading(
                  scoped,
                  this.settings().plannerHeading,
                ),
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
        const confirmed = await this.askForConfirmation({
          title: "Need to create files",
          text: `The following files need to be created: ${needToCreate.join("; ")}`,
          cta: "Create",
        });

        if (!confirmed) {
          new Notice("Edit canceled");
          this.syncDataview?.();

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
    } = createHooks({
      app: this.app,
      dataviewFacade: this.dataviewFacade,
      workspaceFacade: this.workspaceFacade,
      settingsStore: this.settingsStore,
      onUpdate,
    });

    this.syncDataview = () => dataviewSyncTrigger.set({});
    this.registerDomEvent(window, "blur", editContext.cancelEdit);
    this.registerDomEvent(document, "pointerup", editContext.cancelEdit);
    this.register(
      editContext.cursor.subscribe(({ bodyCursor }) => {
        document.body.style.cursor = bodyCursor;
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

    const defaultObsidianContext: ObsidianContext = {
      search,
      workspaceFacade: this.workspaceFacade,
      initWeeklyView: this.initWeeklyLeaf,
      refreshTasks: this.dataviewFacade.getAllTasksFrom,
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
    };

    const componentContext = new Map<
      string,
      ObsidianContext | typeof errorStore
    >([
      [obsidianContext, defaultObsidianContext],
      [errorContextKey, errorStore],
    ]);

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(leaf, this.settings, componentContext, dateRanges),
    );

    this.registerView(
      viewTypeWeekly,
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
