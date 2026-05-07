import { noop } from "lodash/fp";
import type { Moment } from "moment";
import { type CachedMetadata, MetadataCache, type Vault } from "obsidian";
import { derived, get, writable } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { expect, vi } from "vitest";

import { createUpdateHandler } from "../../src/create-update-handler";
import { dataviewChange } from "../../src/redux/dataview/dataview-slice";
import { initialState } from "../../src/redux/global-slice";
import { createReactor, type RootState } from "../../src/redux/store";
import {
  indexRequested,
  selectTaskEntriesById,
} from "../../src/redux/tracker/tracker-slice";
import { TransactionWriter } from "../../src/service/diff-writer";
import { ListItemEntryEditor } from "../../src/service/list-item-entry-editor";
import { ListPropsParser } from "../../src/service/list-props-parser";
import { MetadataCacheFacade } from "../../src/service/metadata-cache-facade";
import type { PeriodicNotes } from "../../src/service/periodic-notes";
import { VaultFacade } from "../../src/service/vault-facade";
import type { WorkspaceFacade } from "../../src/service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../src/settings";
import { isLocal, type Task } from "../../src/task-types";
import { useTasks } from "../../src/ui/hooks/use-tasks";
import { getOneLineSummary } from "../../src/util/task-utils";
import {
  FakeMetadataCache,
  FakePeriodicNotes,
  FakeWorkspaceFacade,
  InMemoryVault,
  type InMemoryFile,
} from "../test-utils";

import { loadMetadataDump } from "./metadata-dump";

function initTestServices(props: {
  inMemoryFiles: InMemoryFile[];
  inMemoryDailyNotes: { path: string; file: InMemoryFile; date: Moment }[];
  cachedMetadata: Record<string, CachedMetadata>;
}) {
  const { inMemoryFiles, inMemoryDailyNotes, cachedMetadata } = props;

  // Fakes:

  const periodicNotes = new FakePeriodicNotes(
    inMemoryDailyNotes,
  ) as unknown as PeriodicNotes;

  const metadataCache = new FakeMetadataCache(
    cachedMetadata,
  ) as unknown as MetadataCache;

  const vault = new InMemoryVault(inMemoryFiles);

  const getTasksApi = () => {
    throw new Error("Can't access tasks API inside tests");
  };

  const workspaceFacade =
    new FakeWorkspaceFacade() as unknown as WorkspaceFacade;

  // Real ones:

  const vaultFacade = new VaultFacade(vault as unknown as Vault, getTasksApi);

  const transactionWriter = new TransactionWriter(vaultFacade);

  const listPropsParser = new ListPropsParser(
    vault as unknown as Vault,
    metadataCache,
  );

  const metadataCacheFacade = new MetadataCacheFacade(metadataCache);

  return {
    periodicNotes,
    metadataCache,
    vault,
    transactionWriter,
    workspaceFacade,
    vaultFacade,
    listPropsParser,
    metadataCacheFacade,
  };
}

export async function setUp(props?: {
  visibleDays?: string[];
  loadedFixtures?: string[];
  settings?: DayPlannerSettings;
}) {
  const {
    visibleDays = [],
    loadedFixtures,
    settings = defaultSettingsForTests,
  } = props || {};

  const { inMemoryFiles, inMemoryDailyNotes, cachedMetadata } =
    await loadMetadataDump({ loadedFixtures });

  const {
    periodicNotes,
    metadataCache,
    vault,
    transactionWriter,
    workspaceFacade,
    vaultFacade,
    listPropsParser,
    metadataCacheFacade,
  } = initTestServices({
    inMemoryFiles,
    inMemoryDailyNotes,
    cachedMetadata,
  });

  const isOnline = writable(true);
  const settingsStore = writable(settings);
  const currentTime = writable(window.moment());

  const onEditCanceled = vi.fn();
  const onEditConfirmed = vi.fn();
  const defaultPreloadedStateForTests: Partial<RootState> = {
    obsidian: {
      ...initialState,
      visibleDays,
    },
    settings: { settings },
  };

  const {
    useSelectorV2: useSelector,
    getState,
    dispatch,
    remoteTasks,
    localTasks,
    taskUpdateTrigger,
    pointerDateTime,
  } = createReactor({
    preloadedState: {
      ...defaultPreloadedStateForTests,
      obsidian: {
        ...initialState,
        visibleDays,
      },
    },
    listPropsParser,
    vault: vault as unknown as Vault,
    metadataCache,
    periodicNotes,
    settings: defaultSettingsForTests,
  });

  const taskEntryEditor = new ListItemEntryEditor(
    getState,
    workspaceFacade,
    vaultFacade,
    metadataCacheFacade,
    listPropsParser,
  );

  inMemoryFiles.forEach(({ path }) => {
    isNotVoid(
      cachedMetadata[path],
      `There is no cached metadata for file with path: ${path}`,
    );

    dispatch(dataviewChange(path));
    dispatch(indexRequested([path]));
  });

  const onUpdate = createUpdateHandler({
    settings: () => settings,
    transactionWriter,
    vaultFacade,
    periodicNotes,
    onEditCanceled,
    onEditConfirmed,
    getTextInput: () => Promise.resolve("Text input"),
    getConfirmationInput: () => Promise.resolve(true),
  });

  const { tasksWithTimeForToday, editContext, newlyStartedTasks } = useTasks({
    onUpdate,
    onEditAborted: () => {},
    periodicNotes,
    workspaceFacade,
    isOnline,
    dataviewChange: taskUpdateTrigger,
    settingsStore,
    currentTime,
    pointerDateTime,
    remoteTasks,
    localTasks,
  });

  const allTasks = derived(
    editContext.dayToDisplayedTasks,
    ($dayToDisplayedTasks) => {
      return Object.values($dayToDisplayedTasks).flatMap(
        ({ withTime, noTime }) => withTime.concat(noTime),
      );
    },
  );

  // this prevents the store from resetting;
  allTasks.subscribe(noop);

  function moveCursorTo(
    dateTime: Moment,
    type: "date" | "dateTime" = "dateTime",
  ) {
    pointerDateTime.set({
      dateTime,
      type,
    });
  }

  function findTask(predicate: (task: Task) => boolean) {
    const found = get(allTasks).filter(isLocal).find(predicate);

    isNotVoid(found, `Task not found`);

    return found;
  }

  function findByText(text: string) {
    return findTask((it) => getOneLineSummary(it).includes(text));
  }

  await vi.waitFor(() => {
    // todo: just wait for cache to be 'warm'
    const isAtLeastOneTaskEntryLoaded =
      Object.keys(useSelector((state) => selectTaskEntriesById(state)).current)
        .length > 0;

    expect(isAtLeastOneTaskEntryLoaded).toBeTruthy();
  });

  return {
    useSelector,
    getState,
    dispatch,
    tasksWithTimeForToday,
    editContext,
    newlyStartedTasks,
    periodicNotes,
    moveCursorTo,
    onUpdate,
    vault,
    findTask,
    findByText,
    allTasks,
    transactionWriter,
    currentTime,
    metadataCache,
    taskEntryEditor,
  };
}
