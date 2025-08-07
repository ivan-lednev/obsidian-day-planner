import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { noop } from "lodash/fp";
import type { Moment } from "moment";
import { type CachedMetadata, MetadataCache, type Vault } from "obsidian";
import type { SListEntry, STask } from "obsidian-dataview";
import { derived, get, writable } from "svelte/store";
import { isNotVoid } from "typed-assert";
import { describe, expect, test, vi } from "vitest";

import { createUpdateHandler } from "../src/create-update-handler";
import { dataviewChange } from "../src/redux/dataview/dataview-slice";
import { initialState } from "../src/redux/global-slice";
import { createReactor, type RootState } from "../src/redux/store";
import type { DataviewFacade } from "../src/service/dataview-facade";
import { TransactionWriter } from "../src/service/diff-writer";
import { ListPropsParser } from "../src/service/list-props-parser";
import type { PeriodicNotes } from "../src/service/periodic-notes";
import { VaultFacade } from "../src/service/vault-facade";
import type { WorkspaceFacade } from "../src/service/workspace-facade";
import {
  type DayPlannerSettings,
  defaultSettingsForTests,
} from "../src/settings";
import { isLocal, type Task } from "../src/task-types";
import { EditMode } from "../src/ui/hooks/use-edit/types";
import { useTasks } from "../src/ui/hooks/use-tasks";
import { getOneLineSummary } from "../src/util/task-utils";

import {
  createInMemoryFile,
  FakeDataviewFacade,
  FakeMetadataCache,
  FakePeriodicNotes,
  FakeWorkspaceFacade,
  getPathToDiff,
  InMemoryVault,
  type InMemoryFile,
} from "./test-utils";

const { join } = path.posix;

const dailyNoteFileNames = ["2025-07-19", "2025-07-20", "2025-07-28"];

const fixturesDirPath = "fixtures";
const dumpPath = join(fixturesDirPath, "metadata-dump", "tasks.json");
const fixtureVaultPath = join(fixturesDirPath, "fixture-vault");

async function loadMetadataDump() {
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

  const inMemoryDailyNotes = dailyNoteFileNames.map((it) => {
    const path = join(fixtureVaultPath, `${it}.md`);
    const file = pathToInMemoryFile[path];

    isNotVoid(file, `There is no file for key: '${it}'`);

    return { path, file, date: window.moment(it) };
  });

  return {
    inMemoryFiles,
    inMemoryDailyNotes,
    tasks,
    lists,
    cachedMetadata,
  };
}

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

async function setUp(props: {
  visibleDays: string[];
  settings?: DayPlannerSettings;
}) {
  const { visibleDays, settings = defaultSettingsForTests } = props;

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
  const onIcalsFetched = vi.fn();

  const defaultPreloadedStateForTests: Partial<RootState> = {
    obsidian: {
      ...initialState,
      visibleDays,
    },
    settings: { settings },
  };

  const {
    dispatch,
    remoteTasks,
    taskUpdateTrigger,
    listProps,
    pointerDateTime,
  } = createReactor({
    preloadedState: {
      ...defaultPreloadedStateForTests,
      obsidian: {
        ...initialState,
        visibleDays,
      },
    },
    dataviewFacade,
    onIcalsFetched,
    listPropsParser,
  });

  inMemoryFiles.forEach(({ path }) => {
    dispatch(dataviewChange(path));
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
    const areTasksLoaded = get(allTasks).length > 0;
    const areClocksLoaded = get(tasksWithActiveClockProps).length > 0;

    expect(areTasksLoaded || areClocksLoaded).toBeTruthy();
  });

  return {
    dispatch,
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
    transactionWriter,
    currentTime,
  };
}

describe("Clocks", () => {
  test("Reads log data", async () => {
    const { getDisplayedTasksWithClocksForTimeline } = await setUp({
      visibleDays: ["2025-07-19"],
    });

    const displayedTasks = getDisplayedTasksWithClocksForTimeline(
      window.moment("2025-07-19"),
    );

    expect(get(displayedTasks)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          startTime: window.moment("2025-07-19 12:00"),
          durationMinutes: 150,
        }),
        expect.objectContaining({
          startTime: window.moment("2025-07-19 15:00"),
          durationMinutes: 90,
        }),
        expect.objectContaining({
          startTime: window.moment("2025-07-19 13:00"),
          durationMinutes: 210,
        }),
      ]),
    );
  });

  test.todo("Only reads props under tasks");

  test.todo("Ignores invalid dates, extra keys");

  test("Tasks with active clocks receive durations set to current time", async () => {
    const {
      getDisplayedTasksWithClocksForTimeline,
      currentTime,
      tasksWithActiveClockProps,
    } = await setUp({
      visibleDays: ["2025-01-11"],
    });

    currentTime.set(window.moment("2025-01-01 17:30"));

    const displayedClocks = getDisplayedTasksWithClocksForTimeline(
      window.moment("2025-01-01"),
    );

    expect(get(displayedClocks)).toMatchObject([
      {
        startTime: window.moment("2025-01-01 17:00"),
        durationMinutes: 30,
      },
      {
        startTime: window.moment("2025-01-01 13:00"),
        durationMinutes: 120,
      },
    ]);

    expect(get(tasksWithActiveClockProps)).toMatchObject([
      {
        startTime: window.moment("2025-01-01 17:00"),
        durationMinutes: 30,
      },
    ]);
  });

  test.todo("Splits log entries over midnight");

  test.todo("Parses code blocks under nested tasks");

  describe("Clocking in", () => {
    test.todo("Clocks in on tasks");

    test.todo("Does not clock in on tasks with active clocks");

    test.todo("Does not mess up other child blocks in list");

    test.todo(
      "For a single line in a file, adds a newline instead of appending the code block to the line",
    );
  });

  describe("Clocking out", () => {
    test.todo("Clocks out on tasks");

    test.todo("Does not clock out on tasks without a clock");
  });

  describe("Canceling clocks", () => {
    test.todo("Cancels clocks");

    test.todo("Does not touch a file without an active clock");
  });
});

describe("Task views", () => {
  describe("Frontmatter", () => {
    test.todo("Shows log entries from frontmatter");

    test.todo("Edits log entries from frontmatter");
  });

  test.fails(
    "Ignores tasks and lists outside of planner section in daily notes",
    async () => {
      const { editContext } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      const displayedTasks = editContext.getDisplayedTasksForTimeline(
        window.moment("2025-07-19"),
      );

      expect(get(displayedTasks)?.withTime).toHaveLength(1);
      expect(get(displayedTasks)?.withTime).toMatchObject([
        { startTime: window.moment("2025-07-19 11:00"), durationMinutes: 30 },
      ]);
    },
  );

  test.todo("Tasks do not contain duplicates");

  test.todo("Combines tasks from daily notes with tasks from other files");
});

describe("Editing", () => {
  describe("Daily notes", () => {
    test("Edits tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Un-schedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("List item under planner heading"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test("Creates tasks", async () => {
      const { editContext, moveCursorTo, vault } = await setUp({
        visibleDays: ["2025-07-19", "2025-07-20"],
      });

      moveCursorTo(window.moment("2025-07-20 13:00"));
      editContext.handlers.handleContainerMouseDown();
      moveCursorTo(window.moment("2025-07-20 14:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test(`* Moves a nested task with text between notes
* Does not touch invalid markdown
* Undoes the move`, async () => {
      const {
        editContext,
        moveCursorTo,
        vault,
        findByText,
        transactionWriter,
      } = await setUp({
        visibleDays: ["2025-07-28"],
        settings: {
          ...defaultSettingsForTests,
          sortTasksInPlanAfterEdit: true,
        },
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Child"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-20 17:00"));

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();

      await transactionWriter.undo();

      expect(
        Object.keys(getPathToDiff(vault.initialState, vault.state)).length,
      ).toBe(0);
    });

    describe("Sorting by time", () => {
      test.todo("Sorts tasks after non-mdast edit");

      test.todo("Skips sorting if day planner heading is not found");
    });
  });

  describe("Obsidian-tasks", () => {
    test("Schedules tasks & un-schedules tasks", async () => {
      const { editContext, moveCursorTo, vault, findByText } = await setUp({
        visibleDays: ["2025-07-19"],
      });

      editContext.handlers.handleGripMouseDown(
        findByText("Task without time"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19 13:00"));

      await editContext.confirmEdit();

      editContext.handlers.handleGripMouseDown(
        findByText("Task with time"),
        EditMode.DRAG,
      );

      moveCursorTo(window.moment("2025-07-19"), "date");

      await editContext.confirmEdit();

      expect(getPathToDiff(vault.initialState, vault.state)).toMatchSnapshot();
    });

    test.todo(
      "Updates tasks plugin props without duplicating timestamps if moved to same time on another day",
    );
  });
});
