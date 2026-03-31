import {
  MarkdownView,
  Notice,
  Plugin,
  WorkspaceLeaf,
  type MarkdownFileInfo,
  TFile,
} from "obsidian";
import { getAPI } from "obsidian-dataview";
import { fromStore, get, type Readable, type Writable } from "svelte/store";
import { isInstanceOf, isNotVoid } from "typed-assert";

import {
  obsidianContextKey,
  viewTypeReleaseNotes,
  viewTypeTimeline,
  viewTypeMultiDay,
  reQueryAfterMillis,
  icalRefreshIntervalMillis,
} from "./constants";
import { createUpdateHandler, getTextFromUser } from "./create-update-handler";
import { createDumpMetadataCommand } from "./dump-metadata";
import { TimeTrackingFeature } from "./feature/time-tracking-feature";
import { currentTime } from "./global-store/current-time";
import { settings } from "./global-store/settings";
import {
  compareByTimestampInText,
  fromMarkdown,
  positionContainsPoint,
  sortListsRecursively,
  toEditorPos,
  toMarkdown,
  toMdastPoint,
} from "./mdast/mdast";
import { dataviewChange } from "./redux/dataview/dataview-slice";
import { editCanceled, visibleDaysUpdated } from "./redux/global-slice";
import { icalRefreshRequested } from "./redux/ical/ical-slice";
import { settingsUpdated } from "./redux/settings-slice";
import { type AppDispatch, type AppStore, createReactor } from "./redux/store";
import { selectActiveClocks } from "./redux/tracker/tracker-slice";
import { createUseSelector, createUseSelectorV2 } from "./redux/use-selector";
import { createSvelteSignalFromReduxStore } from "./redux/use-selector";
import { DataviewFacade } from "./service/dataview-facade";
import { TransactionWriter } from "./service/diff-writer";
import { ListPropsParser } from "./service/list-props-parser";
import { MetadataCacheFacade } from "./service/metadata-cache-facade";
import { PeriodicNotes } from "./service/periodic-notes";
import { TaskEntryEditor } from "./service/task-entry-editor";
import { VaultFacade } from "./service/vault-facade";
import { WorkspaceFacade } from "./service/workspace-facade";
import { type DayPlannerSettings, defaultSettings } from "./settings";
import type { RemoteTask } from "./task-types";
import { createGetTasksApi } from "./tasks-plugin";
import type { ObsidianContext, OnUpdateFn, PointerDateTime } from "./types";
import { askForConfirmation } from "./ui/confirmation-modal";
import { createEditorMenuCallback } from "./ui/editor-menu";
import { useDateRanges } from "./ui/hooks/use-date-ranges";
import { useDebounceWithDelay } from "./ui/hooks/use-debounce-with-delay";
import { mountStatusBarWidget } from "./ui/hooks/use-status-bar-widget";
import { useTasks } from "./ui/hooks/use-tasks";
import { useVisibleDays } from "./ui/hooks/use-visible-days";
import MultiDayView from "./ui/multi-day-view";
import { DayPlannerReleaseNotesView } from "./ui/release-notes";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimelineView from "./ui/timeline-view";
import { createUndoNotice } from "./ui/undo-notice";
import { createEnvironmentHooks } from "./util/create-environment-hooks";
import { createRenderMarkdown } from "./util/create-render-markdown";
import { createShowPreview } from "./util/create-show-preview";
import { notifyAboutStartedTasks } from "./util/notify-about-started-tasks";

export default class DayPlanner extends Plugin {
  settings!: () => DayPlannerSettings;
  private settingsStore!: Writable<DayPlannerSettings>;
  private workspaceFacade!: WorkspaceFacade;
  private dataviewFacade!: DataviewFacade;
  private periodicNotes!: PeriodicNotes;
  private taskEntryEditor!: TaskEntryEditor;
  private vaultFacade!: VaultFacade;
  private transactionWriter!: TransactionWriter;
  private metadataCacheFacade!: MetadataCacheFacade;

  async onload() {
    const { vault, metadataCache } = this.app;

    const initialSettings: DayPlannerSettings = {
      ...defaultSettings,
      ...(await this.loadData()),
    };

    const getTasksApi = createGetTasksApi(this.app);
    const listPropsParser = new ListPropsParser(vault, metadataCache);

    this.periodicNotes = new PeriodicNotes();
    this.vaultFacade = new VaultFacade(vault, getTasksApi);
    this.transactionWriter = new TransactionWriter(this.vaultFacade);
    this.workspaceFacade = new WorkspaceFacade(
      this.app.workspace,
      this.vaultFacade,
      this.periodicNotes,
    );
    this.dataviewFacade = new DataviewFacade(() => getAPI(this.app), vault);
    this.metadataCacheFacade = new MetadataCacheFacade(metadataCache);

    const {
      store,
      getState,
      dispatch,
      useSelector,
      useSelectorV2,
      listenerMiddleware,
      remoteTasks,
      taskUpdateTrigger,
      dataviewLoaded,
      pointerDateTime,
      dataviewRefreshSignal,
    } = createReactor({
      listPropsParser,
      vault,
      metadataCache,
    });

    this.taskEntryEditor = new TaskEntryEditor(
      getState,
      this.workspaceFacade,
      this.vaultFacade,
      this.metadataCacheFacade,
      listPropsParser,
    );

    this.register(() => {
      listenerMiddleware.clearListeners();
    });

    this.initSettingsStore({ initialSettings, dispatch });
    this.registerViews({
      store,
      dispatch,
      remoteTasks,
      taskUpdateTrigger,
      dataviewLoaded,
      pointerDateTime,
      dataviewRefreshSignal,
      useSelector,
      useSelectorV2,
    });

    const handleEditorMenu = createEditorMenuCallback({
      taskEntryEditor: this.taskEntryEditor,
      metadataCacheFacade: this.metadataCacheFacade,
      metadataCache,
      listPropsParser,
    });

    this.registerEvent(this.app.workspace.on("editor-menu", handleEditorMenu));

    this.registerCommands();
    this.addRibbonIcons();
    this.addSettingTab(new DayPlannerSettingsTab(this, this.settingsStore));

    await this.handleNewPluginVersion();
    await this.initTimelineLeafSilently();

    const timeTrackingFeature = new TimeTrackingFeature(
      this,
      this.app.workspace,
      vault,
      metadataCache,
      dispatch,
    );

    timeTrackingFeature.load();
  }

  async onunload() {
    return Promise.all([
      this.detachLeavesOfType(viewTypeTimeline),
      this.detachLeavesOfType(viewTypeMultiDay),
    ]);
  }

  addRibbonIcons() {
    this.addRibbonIcon(
      "calendar-range",
      "Open Timeline",
      this.initTimelineLeaf,
    );
    this.addRibbonIcon("table-2", "Open Multi-Day View", this.initWeeklyLeaf);
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
        const dailyNote = await this.periodicNotes.createDailyNoteIfNeeded(
          window.moment(),
        );

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
      editorCallback: () => this.taskEntryEditor.clockInUnderCursor(),
    });

    this.addCommand({
      icon: "square",
      id: "clock-out",
      name: "Clock out",
      editorCallback: () => this.taskEntryEditor.clockOutUnderCursor(),
    });

    this.addCommand({
      icon: "trash-2",
      id: "cancel-clock",
      name: "Cancel clock",
      editorCallback: () => this.taskEntryEditor.cancelClockUnderCursor(),
    });
  }

  private initSettingsStore(props: {
    initialSettings: DayPlannerSettings;
    dispatch: AppDispatch;
  }) {
    const { initialSettings, dispatch } = props;

    settings.set(initialSettings);

    this.register(
      settings.subscribe(async (newValue) => {
        dispatch(settingsUpdated(newValue));

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

  getSTaskUnderCursor = (view: MarkdownFileInfo) => {
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

  private registerViews(props: {
    store: AppStore;
    dispatch: AppDispatch;
    useSelector: ReturnType<typeof createUseSelector>;
    useSelectorV2: ReturnType<typeof createUseSelectorV2>;
    remoteTasks: Readable<RemoteTask[]>;
    taskUpdateTrigger: Readable<unknown>;
    dataviewLoaded: Readable<boolean>;
    pointerDateTime: Writable<PointerDateTime>;
    dataviewRefreshSignal: Readable<unknown>;
  }) {
    const {
      store,
      dispatch,
      useSelector,
      useSelectorV2,
      remoteTasks,
      taskUpdateTrigger,
      dataviewLoaded,
      pointerDateTime,
      dataviewRefreshSignal,
    } = props;

    let currentUndoNotice: Notice | undefined;

    const onUpdate: OnUpdateFn = createUpdateHandler({
      settings: this.settings,
      transactionWriter: this.transactionWriter,
      vaultFacade: this.vaultFacade,
      periodicNotes: this.periodicNotes,
      onEditConfirmed: () => {
        currentUndoNotice?.hide();
        currentUndoNotice = createUndoNotice(this.transactionWriter.undo);
      },
      onEditCanceled: () => {
        new Notice("Edit canceled");

        dispatch(editCanceled());
      },
      getTextInput: () => getTextFromUser(this.app),
      getConfirmationInput: (input) =>
        askForConfirmation({
          ...input,
          app: this.app,
        }),
    });

    const onEditAborted = () => {
      new Notice("Tasks changed externally; edit canceled");
    };

    const { isDarkMode, isOnline, keyDown, isModPressed, layoutReady } =
      createEnvironmentHooks({ workspace: this.app.workspace });

    const debouncedTaskUpdateTrigger = useDebounceWithDelay(
      taskUpdateTrigger,
      keyDown,
      reQueryAfterMillis,
    );

    const dateRanges = useDateRanges();
    const visibleDays = useVisibleDays(dateRanges.ranges);

    const { tasksWithTimeForToday, editContext, newlyStartedTasks } = useTasks({
      onUpdate,
      onEditAborted,
      periodicNotes: this.periodicNotes,
      dataviewFacade: this.dataviewFacade,
      metadataCache: this.app.metadataCache,
      workspaceFacade: this.workspaceFacade,
      isOnline,
      visibleDays,
      layoutReady,
      debouncedTaskUpdateTrigger,
      dataviewChange: dataviewRefreshSignal,
      settingsStore: this.settingsStore,
      currentTime,
      pointerDateTime,
      remoteTasks,
    });

    this.registerInterval(
      window.setInterval(() => {
        dispatch(icalRefreshRequested());
      }, icalRefreshIntervalMillis),
    );

    dispatch(icalRefreshRequested());

    this.registerEvent(
      this.app.metadataCache.on(
        // @ts-expect-error
        "dataview:metadata-change",
        (eventType: unknown, file: TFile) =>
          dispatch(dataviewChange(file.path)),
      ),
    );

    this.registerDomEvent(window, "blur", editContext.cancelEdit);
    this.registerDomEvent(document, "pointerup", editContext.cancelEdit);

    this.register(
      editContext.cursor.subscribe(({ bodyCursor }) => {
        document.body.style.cursor = bodyCursor;
      }),
    );
    this.register(
      visibleDays.subscribe((days) => {
        dispatch(
          // without the offset, an event right of UTC is going to be displayed as the previous day
          // a visible day in my zone is 2025-04-15, but in UTC it's 2025-04-14T22:00:00, and getDayKey returns 2025-04-14
          visibleDaysUpdated(days.map((it) => it.toISOString(true))),
        );
      }),
    );

    const destroyStatusBarWidget = mountStatusBarWidget({
      plugin: this,
      dateRanges,
      tasksWithTimeForToday,
    });

    this.register(destroyStatusBarWidget);

    this.register(
      newlyStartedTasks.subscribe((value) =>
        notifyAboutStartedTasks(value, this.settings()),
      ),
    );
    this.addCommand({
      id: "re-sync",
      name: "Re-sync tasks",
      callback: async () => {
        dispatch(icalRefreshRequested());
      },
    });

    this.addCommand({
      id: "jump-to-active-clock",
      name: "Jump to active clock",
      callback: () => {
        const currentTasksWithActiveClockProps = selectActiveClocks(
          store.getState(),
        );

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

    if (envMode === "development") {
      this.addCommand({
        id: "dump-metadata",
        name: "Dump metadata to files",
        callback: createDumpMetadataCommand(this.app),
      });
    }

    const defaultObsidianContext: ObsidianContext = {
      storeSignal: createSvelteSignalFromReduxStore(store),
      periodicNotes: this.periodicNotes,
      taskEntryEditor: this.taskEntryEditor,
      workspaceFacade: this.workspaceFacade,
      initWeeklyView: this.initWeeklyLeaf,
      refreshDataviewFn: this.dataviewFacade.getAllTasksFrom,
      dataviewLoaded,
      renderMarkdown: createRenderMarkdown(this.app),
      toggleCheckboxInFile: this.vaultFacade.toggleCheckboxInFile,
      editContext,
      showPreview: createShowPreview(this.app),
      isModPressed,
      reSync: () => dispatch(icalRefreshRequested()),
      isOnline,
      isDarkMode,
      settings,
      settingsSignal: fromStore(settings),
      pointerDateTime,
      dispatch,
      useSelector,
      useSelectorV2,
    };

    const componentContext = new Map<string, ObsidianContext>([
      [obsidianContextKey, defaultObsidianContext],
    ]);

    this.registerView(
      viewTypeTimeline,
      (leaf: WorkspaceLeaf) =>
        new TimelineView(
          leaf,
          this.settings,
          componentContext,
          dateRanges,
          this.periodicNotes,
        ),
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
