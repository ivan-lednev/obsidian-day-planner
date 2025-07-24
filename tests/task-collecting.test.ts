import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { isAnyOf } from "@reduxjs/toolkit";
import { MetadataCache, type Vault } from "obsidian";
import { derived, get, writable } from "svelte/store";
import { describe, expect, test, vi } from "vitest";

import {
  dataviewChange,
  listPropsParsed,
  selectDataviewLoaded,
  selectListProps,
} from "../src/redux/dataview/dataview-slice";
import { editCanceled, initialState } from "../src/redux/global-slice";
import { selectRemoteTasks } from "../src/redux/ical/ical-slice";
import { initListenerMiddleware } from "../src/redux/listener-middleware";
import { selectDataviewSource } from "../src/redux/settings-slice";
import { makeStore, type RootState } from "../src/redux/store";
import { useActionDispatched } from "../src/redux/use-action-dispatched";
import { createUseSelector } from "../src/redux/use-selector";
import type { DataviewFacade } from "../src/service/dataview-facade";
import type { WorkspaceFacade } from "../src/service/workspace-facade";
import { defaultSettingsForTests } from "../src/settings";
import type { PointerDateTime } from "../src/types";
import { useTasks } from "../src/ui/hooks/use-tasks";
import { getUpdateTrigger } from "../src/util/store";

import {
  createInMemoryFile,
  FakeDataviewFacade,
  FakeMetadataCache,
  FakePeriodicNotes,
  FakeWorkspaceFacade,
  getPathToDiff,
  InMemoryVault,
} from "./test-utils";

import type { PeriodicNotes } from "../src/service/periodic-notes";
import { isNotVoid } from "typed-assert";
import { EditMode } from "../src/ui/hooks/use-edit/types";
import type { Moment } from "moment";
import { noop } from "lodash/fp";
import { TransactionWriter } from "../src/service/diff-writer";
import { createUpdateHandler } from "../src/create-update-handler";
import { VaultFacade } from "../src/service/vault-facade";
import { isLocal, type Task } from "../src/task-types";
import { getOneLineSummary } from "../src/util/task-utils";

const { join } = path.posix;

const defaultVisibleDays = ["2024-09-26"];

const defaultPreloadedStateForTests: Partial<RootState> = {
  obsidian: {
    ...initialState,
    visibleDays: defaultVisibleDays,
  },
  settings: {
    settings: {
      ...defaultSettingsForTests,
    },
  },
};

function makeStoreForTests(props: {
  vault: Vault;
  metadataCache: MetadataCache;
  dataviewFacade: DataviewFacade;
  preloadedState?: Partial<RootState>;
}) {
  const {
    metadataCache,
    dataviewFacade,
    vault,
    preloadedState = defaultPreloadedStateForTests,
  } = props;

  const listenerMiddleware = initListenerMiddleware({
    extra: {
      metadataCache,
      dataviewFacade,
      vault,
      onIcalsFetched: async () => {},
    },
  });

  const store = makeStore({
    preloadedState,
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware().concat(listenerMiddleware.middleware);
    },
  });

  return { store, listenerMiddleware };
}

/**
 * This assembles all the system separated from the UI, Obsidian, time, DOM, etc.
 * @param props
 */
async function setUp(props: { visibleDays?: string[] }) {
  const { visibleDays = defaultVisibleDays } = props;

  const fixturesDirPath = "fixtures";
  const dumpPath = join(fixturesDirPath, "metadata-dump", "tasks.json");
  const fixtureVaultPath = join(fixturesDirPath, "fixture-vault");

  const files = await readdir(fixtureVaultPath);

  const inMemoryFiles = await Promise.all(
    files.map(async (file) => {
      const filePath = join(fixtureVaultPath, file);

      const stats = await stat(filePath);

      if (!stats.isFile()) {
        throw new TypeError(
          `Only files are supported in fixture vault, not this: ${filePath}`,
        );
      }

      const contents = await readFile(filePath, "utf8");

      return createInMemoryFile({ path: filePath, contents });
    }),
  );

  const rawMetadataDump = await readFile(dumpPath, "utf-8");

  const metadataDump = JSON.parse(rawMetadataDump);
  const { tasks, lists, cachedMetadata } = metadataDump;

  const pathToInMemoryFile = Object.fromEntries(
    inMemoryFiles.map((it) => [it.path, it]),
  );

  const dailyNoteFileNames = ["2025-07-19", "2025-07-20"];

  const inMemoryDailyNotes = dailyNoteFileNames.map((it) => {
    const path = join(fixtureVaultPath, `${it}.md`);
    const file = pathToInMemoryFile[path];

    isNotVoid(file, `There is no file for key: '${it}'`);

    return { path, file, date: window.moment(it) };
  });

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

  const {
    store,
    store: { dispatch, getState },
    listenerMiddleware,
  } = makeStoreForTests({
    dataviewFacade,
    metadataCache,
    vault: vault as unknown as Vault,
    preloadedState: {
      ...defaultPreloadedStateForTests,
      obsidian: {
        ...initialState,
        visibleDays,
      },
    },
  });

  inMemoryFiles.forEach(({ path }) => {
    store.dispatch(dataviewChange(path));
  });

  const visibleDaysStore = writable(visibleDays.map((it) => window.moment(it)));
  const isOnline = writable(true);
  const layoutReady = writable(true);
  const settingsStore = writable(defaultSettingsForTests);
  const currentTime = writable(window.moment());

  const onEditCanceled = vi.fn();
  const onEditConfirmed = vi.fn();

  const onUpdate = createUpdateHandler({
    settings: () => defaultSettingsForTests,
    transactionWriter,
    vaultFacade,
    periodicNotes,
    onEditCanceled,
    onEditConfirmed,
    getTextInput: () => Promise.resolve("Text input"),
    getConfirmationInput: () => Promise.resolve(true),
  });

  // todo: remove copy-pasta
  const useSelector = createUseSelector(store);
  const actionDispatched = useActionDispatched({ listenerMiddleware });

  const remoteTasks = useSelector(selectRemoteTasks);
  const listProps = useSelector(selectListProps);
  const dataviewLoaded = useSelector(selectDataviewLoaded);
  const dataviewSource = useSelector(selectDataviewSource);

  const dataviewRefreshSignal = derived(
    actionDispatched,
    ($actionDispatched, set) => {
      // todo: fix in real code
      if (isAnyOf(listPropsParsed, editCanceled)($actionDispatched)) {
        set($actionDispatched);
      }
    },
  );

  const taskUpdateTrigger = derived(
    [dataviewRefreshSignal, dataviewSource],
    getUpdateTrigger,
  );

  const pointerDateTime = writable<PointerDateTime>({
    dateTime: window.moment(),
    type: "dateTime",
  });
  // ---

  const {
    tasksWithActiveClockProps,
    getDisplayedTasksWithClocksForTimeline,
    tasksWithTimeForToday,
    editContext,
    newlyStartedTasks,
  } = useTasks({
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
    listProps,
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

  // todo: copy-pasta
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

    isNotVoid(found, "Task not found. Wrong test code");

    return found;
  }

  function findByText(text: string) {
    return findTask((it) => getOneLineSummary(it).includes(text));
  }

  return {
    dispatch,
    getState,
    tasksWithActiveClockProps,
    getDisplayedTasksWithClocksForTimeline,
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
  };
}

describe("Task views", () => {
  describe("Log entry views", () => {
    test("Reads log data", async () => {
      const { getDisplayedTasksWithClocksForTimeline } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      const displayedTasks = getDisplayedTasksWithClocksForTimeline(
        window.moment("2025-07-19"),
      );

      await vi.waitFor(() => expect(get(displayedTasks)).toHaveLength(3));

      expect(get(displayedTasks)).toMatchObject([
        {
          startTime: window.moment("2025-07-19 12:00"),
          durationMinutes: 150,
        },
        {
          startTime: window.moment("2025-07-19 15:00"),
          durationMinutes: 90,
        },
        {
          startTime: window.moment("2025-07-19 13:00"),
          durationMinutes: 210,
        },
      ]);
    });

    test.todo("Ignores invalid dates, extra keys");

    test.todo("Tasks with active clocks receive durations set to current time");

    test.todo("Splits log entries over midnight");
  });

  test("Ignores tasks and lists outside of planner section", async () => {
    const { editContext } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTasks = editContext.getDisplayedTasksForTimeline(
      window.moment("2025-07-19"),
    );

    await vi.waitFor(() =>
      expect(get(displayedTasks)?.withTime.length).toBeGreaterThan(0),
    );

    expect(get(displayedTasks)?.withTime).toHaveLength(1);
    expect(get(displayedTasks)?.withTime).toMatchObject([
      { startTime: window.moment("2025-07-19 11:00"), durationMinutes: 30 },
    ]);
  });

  test.todo("Tasks do not contain duplicates");

  test.todo("Combines tasks from daily notes with tasks from other files");

  describe("Editing", () => {
    test("Edits tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      const displayedTasks = editContext.getDisplayedTasksForTimeline(
        window.moment("2025-07-19"),
      );

      await vi.waitFor(() =>
        expect(get(displayedTasks)?.withTime.length).toBeGreaterThan(0),
      );

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Moves tasks between daily notes", async () => {
      const { editContext, moveCursorTo, vault, findByText, allTasks } =
        await setUp({
          visibleDays: ["2025-07-19"],
        });

      await vi.waitFor(() => expect(get(allTasks).length).toBeGreaterThan(0));

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-20 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });
  });

  describe("Frontmatter", () => {
    test.todo("Shows log entries from frontmatter");
  });
});
