import { Function } from "effect";
import type { Moment } from "moment";
import { type CachedMetadata, MetadataCache, type Vault } from "obsidian";
import { derived, get, writable } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { expect, onTestFinished, vi } from "vitest";

import { icalParseLowerLimit } from "../../../src/constants";
import { createUpdateHandler } from "../../../src/create-update-handler";
import { initialState } from "../../../src/redux/date-ranges-slice";
import { type IcalParseTaskResult } from "../../../src/redux/ical/init-ical-listeners";
import {
  indexRequested,
  selectFileEntriesById,
  selectListItemEntriesById,
} from "../../../src/redux/index/index-slice";
import { createReactor, type RootState } from "../../../src/redux/store";
import { TransactionWriter } from "../../../src/service/diff-writer";
import { createYamlEditTargets } from "../../../src/service/edit-yaml";
import { createIndexServices } from "../../../src/service/index/create-index-services";
import { ListPropsParser } from "../../../src/service/list-props-parser";
import { LogEntryEditor } from "../../../src/service/log-entry-editor";
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
import { useTimeBlocks } from "../../../src/ui/hooks/use-time-blocks";
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
    dateRanges: {
      ...initialState,
      ranges: { testRange: visibleDays },
    },
    settings: { settings },
  };

  const icalParseScheduler =
    createBackgroundBatchScheduler<IcalParseTaskResult>({
      timeRemainingLowerLimit: icalParseLowerLimit,
    });

  onTestFinished(() => icalParseScheduler.cancelTasks());

  const {
    useSelector,
    store,
    remoteTimeBlocks,
    localTimeBlocks,
    pointerDateTime,
  } = createReactor({
    preloadedState: defaultPreloadedStateForTests,
    listPropsParser,
    indexServices,
    vault: vault as unknown as Vault,
    metadataCache,
    periodicNotes,
    settings,
    icalParseScheduler,
  });

  const { getState, dispatch } = store;

  const yamlEditTargets = createYamlEditTargets({
    vaultFacade,
    metadataCacheFacade,
    listPropsParser,
    workspaceFacade,
  });

  const logEntryEditor = new LogEntryEditor(yamlEditTargets);

  inMemoryFiles.forEach(({ path }) => {
    isNotVoid(
      cachedMetadata[path],
      `There is no cached metadata for file with path: ${path}`,
    );

    dispatch(indexRequested([path]));
  });

  const onUpdate = createUpdateHandler({
    getSettings: () => settings,
    transactionWriter,
    vaultFacade,
    periodicNotes,
    onEditCanceled,
    onEditConfirmed,
    getTextInput: () => Promise.resolve("Text input"),
    getConfirmationInput: () => Promise.resolve(true),
  });

  const { timeBlocksWithTimeForToday, editContext, newlyStartedTimeBlocks } =
    useTimeBlocks({
      onUpdate,
      onEditAborted: () => {},
      periodicNotes,
      workspaceFacade,
      isOnline,
      settingsStore,
      currentTime,
      pointerDateTime,
      remoteTimeBlocks,
      localTimeBlocks,
    });

  const allTimeBlocks = derived(
    editContext.dayToDisplayedTimeBlocks,
    ($dayToDisplayedTimeBlocks) => {
      return Object.values($dayToDisplayedTimeBlocks).flatMap(
        ({ withTime, noTime }) => withTime.concat(noTime),
      );
    },
  );

  // this prevents the store from resetting;
  allTimeBlocks.subscribe(Function.constVoid);
  localTimeBlocks.subscribe(Function.constVoid);

  function moveCursorTo(
    dateTime: Moment,
    type: "date" | "dateTime" = "dateTime",
  ) {
    pointerDateTime.set({
      dateTime,
      type,
    });
  }

  function findTimeBlock(predicate: (timeBlock: TimeBlock) => boolean) {
    const found = get(allTimeBlocks).filter(isLocal).find(predicate) as
      | EditableTimeBlock
      | undefined;

    isNotVoid(found, `TimeBlock not found`);

    return found;
  }

  function findByText(text: string) {
    return findTimeBlock((it) => getOneLineSummary(it).includes(text));
  }

  await vi.waitFor(() => {
    // todo: replace with explicit `index.state === 'warm'`
    const listItemEntries = selectListItemEntriesById(store.getState());
    const fileEntries = selectFileEntriesById(store.getState());

    const listItemEntriesCount = Object.keys(listItemEntries).length;
    const fileEntriesCount = Object.keys(fileEntries).length;

    expect(listItemEntriesCount + fileEntriesCount).toBeGreaterThan(0);
  });

  return {
    useSelector,
    getState,
    dispatch,
    timeBlocksWithTimeForToday,
    editContext,
    newlyStartedTimeBlocks,
    periodicNotes,
    moveCursorTo,
    onUpdate,
    vault,
    findTimeBlock,
    findByText,
    allTimeBlocks,
    transactionWriter,
    currentTime,
    metadataCache,
    yamlEditTargets,
    logEntryEditor,
  };
}
