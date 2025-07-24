import { isAnyOf } from "@reduxjs/toolkit";
import {
  MarkdownView,
  Notice,
  Plugin,
  WorkspaceLeaf,
  type MarkdownFileInfo,
} from "obsidian";
import { getAPI } from "obsidian-dataview";
import { derived, fromStore, get, writable, type Writable } from "svelte/store";
import { isInstanceOf, isNotVoid } from "typed-assert";

import {
  errorContextKey,
  obsidianContextKey,
  viewTypeReleaseNotes,
  viewTypeTimeline,
  viewTypeMultiDay,
  reQueryAfterMillis,
} from "./constants";
import { createUpdateHandler } from "./create-update-handler";
import { createDumpMetadataCommand } from "./dump-metadata";
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
import {
  listPropsParsed,
  selectDataviewLoaded,
  selectListProps,
} from "./redux/dataview/dataview-slice";
import { editCanceled, visibleDaysUpdated } from "./redux/global-slice";
import {
  icalRefreshRequested,
  selectRemoteTasks,
} from "./redux/ical/ical-slice";
import { selectDataviewSource, settingsUpdated } from "./redux/settings-slice";
import {
  type AppListenerMiddlewareInstance,
  type AppStore,
  initStoreForPlugin,
} from "./redux/store";
import { useActionDispatched } from "./redux/use-action-dispatched";
import { createUseSelector } from "./redux/use-selector";
import { DataviewFacade } from "./service/dataview-facade";
import { TransactionWriter } from "./service/diff-writer";
import { STaskEditor } from "./service/stask-editor";
import { VaultFacade } from "./service/vault-facade";
import { WorkspaceFacade } from "./service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettings,
  type PluginData,
} from "./settings";
import { createGetTasksApi } from "./tasks-plugin";
import type { ObsidianContext, OnUpdateFn, PointerDateTime } from "./types";
import { createEditorMenuCallback } from "./ui/editor-menu";
import { mountStatusBarWidget } from "./ui/hooks/use-status-bar-widget";
import MultiDayView from "./ui/multi-day-view";
import { DayPlannerReleaseNotesView } from "./ui/release-notes";
import { DayPlannerSettingsTab } from "./ui/settings-tab";
import TimelineView from "./ui/timeline-view";
import { createRenderMarkdown } from "./util/create-render-markdown";
import { createShowPreview } from "./util/create-show-preview";
import { notifyAboutStartedTasks } from "./util/notify-about-started-tasks";
import { createEnvironmentHooks } from "./util/create-environment-hooks";
import { getUpdateTrigger } from "./util/store";
import { useDebounceWithDelay } from "./ui/hooks/use-debounce-with-delay";
import { useDateRanges } from "./ui/hooks/use-date-ranges";
import { useTasks } from "./ui/hooks/use-tasks";
import { useVisibleDays } from "./ui/hooks/use-visible-days";
import { PeriodicNotes } from "./service/periodic-notes";

export default class DayPlanner extends Plugin {
  settings!: () => DayPlannerSettings;
  private settingsStore!: Writable<DayPlannerSettings>;
  private workspaceFacade!: WorkspaceFacade;
  private dataviewFacade!: DataviewFacade;
  private periodicNotes!: PeriodicNotes;
  private sTaskEditor!: STaskEditor;
  private vaultFacade!: VaultFacade;
  private transationWriter!: TransactionWriter;
  private currentUndoNotice?: Notice;

  async onload() {
    const initialPluginData: PluginData = {
      ...defaultSettings,
      ...(await this.loadData()),
    };

    const getTasksApi = createGetTasksApi(this.app);

    this.periodicNotes = new PeriodicNotes();
    this.vaultFacade = new VaultFacade(this.app.vault, getTasksApi);
    this.transationWriter = new TransactionWriter(this.vaultFacade);
    this.workspaceFacade = new WorkspaceFacade(
      this.app.workspace,
      this.vaultFacade,
      this.periodicNotes,
    );
    this.dataviewFacade = new DataviewFacade(
      () => getAPI(this.app),
      this.app.vault,
    );
    this.sTaskEditor = new STaskEditor(
      this.workspaceFacade,
      this.vaultFacade,
      this.dataviewFacade,
    );

    const { store, listenerMiddleware } = initStoreForPlugin({
      pluginData: initialPluginData,
      plugin: this,
      dataviewFacade: this.dataviewFacade,
      vault: this.app.vault,
      metadataCache: this.app.metadataCache,
    });

    this.initSettingsStore({ initialSettings: initialPluginData, store });
    this.registerViews({ store, listenerMiddleware });

    const handleEditorMenu = createEditorMenuCallback({
      sTaskEditor: this.sTaskEditor,
      plugin: this,
    });

    this.registerEvent(this.app.workspace.on("editor-menu", handleEditorMenu));

    this.registerCommands();
    this.addRibbonIcons();
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

  private initSettingsStore(props: {
    initialSettings: DayPlannerSettings;
    store: AppStore;
  }) {
    const { initialSettings, store } = props;

    settings.set(initialSettings);

    this.register(
      settings.subscribe(async (newValue) => {
        store.dispatch(settingsUpdated(newValue));

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
    listenerMiddleware: AppListenerMiddlewareInstance;
  }) {
    const { store, listenerMiddleware } = props;

    const onUpdate: OnUpdateFn = createUpdateHandler({
      app: this.app,
      settings: this.settings,
      transactionWriter: this.transationWriter,
      vaultFacade: this.vaultFacade,
      periodicNotes: this.periodicNotes,
      onEditCanceled: () => {
        new Notice("Edit canceled");

        store.dispatch(editCanceled());
      },
    });

    const onEditAborted = () => {
      new Notice("Tasks changed externally; edit canceled");
    };

    /**
     * These are the points of interop from Redux to Svelte
     */
    const useSelector = createUseSelector(store);
    const actionDispatched = useActionDispatched({ listenerMiddleware });

    const remoteTasks = useSelector(selectRemoteTasks);
    const listProps = useSelector(selectListProps);
    const dataviewLoaded = useSelector(selectDataviewLoaded);
    const dataviewSource = useSelector(selectDataviewSource);

    const dataviewRefreshSignal = derived(
      actionDispatched,
      ($actionDispatched, set) => {
        if (isAnyOf(listPropsParsed, editCanceled)) {
          set($actionDispatched);
        }
      },
    );

    const { isDarkMode, isOnline, keyDown, isModPressed, layoutReady } =
      createEnvironmentHooks({ workspace: this.app.workspace });

    const taskUpdateTrigger = derived(
      [dataviewRefreshSignal, dataviewSource],
      getUpdateTrigger,
    );

    const debouncedTaskUpdateTrigger = useDebounceWithDelay(
      taskUpdateTrigger,
      keyDown,
      reQueryAfterMillis,
    );

    const pointerDateTime = writable<PointerDateTime>({
      dateTime: window.moment(),
      type: "dateTime",
    });

    const dateRanges = useDateRanges();
    const visibleDays = useVisibleDays(dateRanges.ranges);

    const {
      tasksWithActiveClockProps,
      getDisplayedTasksWithClocksForTimeline,
      tasksWithTimeForToday,
      editContext,
      newlyStartedTasks,
    } = useTasks({
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
      listProps,
    });

    this.registerDomEvent(window, "blur", editContext.cancelEdit);
    this.registerDomEvent(document, "pointerup", editContext.cancelEdit);

    this.register(
      editContext.cursor.subscribe(({ bodyCursor }) => {
        document.body.style.cursor = bodyCursor;
      }),
    );
    this.register(
      visibleDays.subscribe((days) => {
        store.dispatch(
          // without the offset, an event right of UTC is going to be displayed as the previous day
          // a visible day in my zone is 2025-04-15, but in UTC it's 2025-04-14T22:00:00, and getDayKey returns 2025-04-14
          visibleDaysUpdated(days.map((it) => it.toISOString(true))),
        );
      }),
    );

    const errorStore = writable<Error | undefined>();

    const destroyStatusBarWidget = mountStatusBarWidget({
      plugin: this,
      errorStore,
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
        store.dispatch(icalRefreshRequested());
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

    // todo: show only in dev mode
    this.addCommand({
      id: "dump-metadata",
      name: "Dump metadata to files",
      callback: createDumpMetadataCommand(this.app),
    });

    const defaultObsidianContext: ObsidianContext = {
      periodicNotes: this.periodicNotes,
      sTaskEditor: this.sTaskEditor,
      workspaceFacade: this.workspaceFacade,
      initWeeklyView: this.initWeeklyLeaf,
      refreshDataviewFn: this.dataviewFacade.getAllTasksFrom,
      dataviewLoaded,
      renderMarkdown: createRenderMarkdown(this.app),
      toggleCheckboxInFile: this.vaultFacade.toggleCheckboxInFile,
      editContext,
      showPreview: createShowPreview(this.app),
      isModPressed,
      reSync: () => store.dispatch(icalRefreshRequested()),
      isOnline,
      isDarkMode,
      settings,
      settingsSignal: fromStore(settings),
      pointerDateTime,
      tasksWithActiveClockProps,
      getDisplayedTasksWithClocksForTimeline,
      dispatch: store.dispatch,
      store: store,
      useSelector,
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
