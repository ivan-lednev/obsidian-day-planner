import { noop } from "lodash/fp";
import type { Moment } from "moment";
import { type CachedMetadata, MetadataCache, type Vault } from "obsidian";
import type { SListEntry, STask } from "obsidian-dataview";
import { derived, get, writable } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { expect, vi } from "vitest";

import { createUpdateHandler } from "../../src/create-update-handler";
import { dataviewChange } from "../../src/redux/dataview/dataview-slice";
import { initialState } from "../../src/redux/global-slice";
import { createReactor, type RootState } from "../../src/redux/store";
import {
  indexRequested,
  selectActiveClocks,
} from "../../src/redux/tracker/tracker-slice";
import type { DataviewFacade } from "../../src/service/dataview-facade";
import { TransactionWriter } from "../../src/service/diff-writer";
import { ListPropsParser } from "../../src/service/list-props-parser";
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
  FakeDataviewFacade,
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
  tasks: STask[];
  lists: SListEntry[];
  cachedMetadata: Record<string, CachedMetadata>;
}) {
  const { inMemoryFiles, inMemoryDailyNotes, tasks, lists, cachedMetadata } =
    props;

  const periodicNotes = new FakePeriodicNotes(
    inMemoryDailyNotes,
  ) as unknown as PeriodicNotes;

  const dataviewFacade = new FakeDataviewFacade({
    tasks,
    lists,
  }) as unknown as DataviewFacade;

  const metadataCache = new FakeMetadataCache(
    cachedMetadata,
  ) as unknown as MetadataCache;

  const vault = new InMemoryVault(inMemoryFiles);

  const getTasksApi = () => {
    throw new Error("Can't access tasks API inside tests");
  };

  const vaultFacade = new VaultFacade(vault as unknown as Vault, getTasksApi);

  const transactionWriter = new TransactionWriter(vaultFacade);

  const workspaceFacade =
    new FakeWorkspaceFacade() as unknown as WorkspaceFacade;

  const listPropsParser = new ListPropsParser(
    vault as unknown as Vault,
    metadataCache,
  );

  return {
    periodicNotes,
    dataviewFacade,
    metadataCache,
    vault,
    transactionWriter,
    workspaceFacade,
    vaultFacade,
    listPropsParser,
  };
}

export async function setUp(props?: {
  visibleDays?: string[];
  settings?: DayPlannerSettings;
}) {
  const { visibleDays = [], settings = defaultSettingsForTests } = props || {};

  const { inMemoryFiles, inMemoryDailyNotes, tasks, lists, cachedMetadata } =
    await loadMetadataDump();

  const {
    periodicNotes,
    dataviewFacade,
    metadataCache,
    vault,
    transactionWriter,
    workspaceFacade,
    vaultFacade,
    listPropsParser,
  } = initTestServices({
    inMemoryFiles,
    inMemoryDailyNotes,
    tasks,
    lists,
    cachedMetadata,
  });

  const visibleDaysStore = writable(visibleDays.map((it) => window.moment(it)));
  const isOnline = writable(true);
  const layoutReady = writable(true);
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
  });

  inMemoryFiles.forEach(({ path, contents }) => {
    isNotVoid(cachedMetadata[path]);

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
    dataviewFacade,
    metadataCache,
    workspaceFacade,
    isOnline,
    visibleDays: visibleDaysStore,
    layoutReady,
    debouncedTaskUpdateTrigger: taskUpdateTrigger,
    dataviewChange: taskUpdateTrigger,
    settingsStore,
    currentTime,
    pointerDateTime,
    remoteTasks,
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
    const isAtLeastOneLogRecordLoaded =
      useSelector((state) => selectActiveClocks(state)).current.length > 0;

    expect(isAtLeastOneLogRecordLoaded).toBeTruthy();
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
  };
}
