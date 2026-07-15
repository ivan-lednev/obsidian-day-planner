import { Function } from "effect";
import type { Moment } from "moment";
import { type CachedMetadata, MetadataCache, type Vault } from "obsidian";
import { derived, get, writable } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { expect, onTestFinished, vi } from "vitest";

import { icalParseLowerLimit } from "../../../src/constants";
import { createUpdateHandler } from "../../../src/create-update-handler";
import { initialState } from "../../../src/redux/global-slice";
import { type IcalParseTaskResult } from "../../../src/redux/ical/init-ical-listeners";
import {
  indexRequested,
  selectFileEntriesById,
  selectTaskEntriesById,
} from "../../../src/redux/index/index-slice";
import { createReactor, type RootState } from "../../../src/redux/store";
import { TransactionWriter } from "../../../src/service/diff-writer";
import { createIndexServices } from "../../../src/service/index/create-index-services";
import { ListItemEntryEditor } from "../../../src/service/list-item-entry-editor";
import { ListPropsParser } from "../../../src/service/list-props-parser";
import { MetadataCacheFacade } from "../../../src/service/metadata-cache-facade";
import type { PeriodicNotes } from "../../../src/service/periodic-notes";
import { VaultFacade } from "../../../src/service/vault-facade";
import type { WorkspaceFacade } from "../../../src/service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../../../src/settings";
import {
  isLocal,
  type EditableTimeBlock,
  type TimeBlock,
} from "../../../src/time-block-types";
import { useTasks } from "../../../src/ui/hooks/use-tasks";
import { createBackgroundBatchScheduler } from "../../../src/util/scheduler";
import { getOneLineSummary } from "../../../src/util/time-block-utils";
import {
  FakeMetadataCache,
  FakePeriodicNotes,
  FakeWorkspaceFacade,
  InMemoryVault,
  type InMemoryFile,
} from "../../util/fakes";

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

  const indexServices = createIndexServices({
    listPropsParser,
    periodicNotes,
    settings,
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

  const icalParseScheduler =
    createBackgroundBatchScheduler<IcalParseTaskResult>({
      timeRemainingLowerLimit: icalParseLowerLimit,
    });

  onTestFinished(() => icalParseScheduler.cancelTasks());

  const { useSelector, store, remoteTasks, localTasks, pointerDateTime } =
    createReactor({
      preloadedState: {
        ...defaultPreloadedStateForTests,
        obsidian: {
          ...initialState,
          visibleDays,
        },
      },
      listPropsParser,
      indexServices,
      vault: vault as unknown as Vault,
      metadataCache,
      periodicNotes,
      settings,
      icalParseScheduler,
    });

  const { getState, dispatch } = store;

  const taskEntryEditor = new ListItemEntryEditor(
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
  allTasks.subscribe(Function.constVoid);
  localTasks.subscribe(Function.constVoid);

  function moveCursorTo(
    dateTime: Moment,
    type: "date" | "dateTime" = "dateTime",
  ) {
    pointerDateTime.set({
      dateTime,
      type,
    });
  }

  function findTask(predicate: (task: TimeBlock) => boolean) {
    const found = get(allTasks).filter(isLocal).find(predicate) as
      | EditableTimeBlock
      | undefined;

    isNotVoid(found, `TimeBlock not found`);

    return found;
  }

  function findByText(text: string) {
    return findTask((it) => getOneLineSummary(it).includes(text));
  }

  await vi.waitFor(() => {
    // todo: replace with explicit `index.state === 'warm'`
    const taskEntries = selectTaskEntriesById(store.getState());
    const fileEntries = selectFileEntriesById(store.getState());

    const taskEntriesCount = Object.keys(taskEntries).length;
    const fileEntriesCount = Object.keys(fileEntries).length;

    expect(taskEntriesCount + fileEntriesCount).toBeGreaterThan(0);
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
