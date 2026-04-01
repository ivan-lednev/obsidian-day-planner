import { type PayloadAction } from "@reduxjs/toolkit";
import type {
  CachedMetadata,
  ListItemCache,
  Loc,
  MetadataCache,
  Pos,
  Vault,
} from "obsidian";
import { isNotVoid } from "typed-assert";

import { defaultDayFormat } from "../../constants";
import type { ListPropsParser } from "../../service/list-props-parser";
import { getDaysInRange, strictParse } from "../../util/moment";
import { createAppSlice } from "../create-app-slice";
import type { AppListenerEffect } from "../store";
import { PeriodicNotes } from "../../service/periodic-notes";
import type { DayPlannerSettings } from "../../settings";
import { getTimeFromLine } from "../../parser/parser";
import type { Moment } from "moment";
import { getEndTime } from "../../util/task-utils";

export interface TaskEntry {
  id: string;
  text: string;
  position: Pos;
  propsPosition?: Pos;
  path: string;
  logEntries?: string[];
}

export interface LogEntry {
  start: string;
  end?: string;
  parent: string;
  dayKeys: string[];
  id: string;
}

export interface PlanEntry {
  isAllDay?: boolean;
  start: string;
  end: string;
  parent: string;
  dayKeys: string[];
  id: string;
}

interface IndexSliceState {
  taskEntries: {
    byId: Record<string, TaskEntry>;
    byPath: Record<string, string[]>;
  };
  logEntries: {
    byId: Record<string, LogEntry>;
    byPath: Record<string, string[]>;
    byDay: Record<string, string[]>;
  };
  planEntries: {
    byId: Record<string, LogEntry>;
    byPath: Record<string, string[]>;
    byDay: Record<string, string[]>;
  };
}

const initialState: IndexSliceState = {
  taskEntries: { byPath: {}, byId: {} },
  logEntries: {
    byPath: {},
    byId: {},
    byDay: {},
  },
  planEntries: {
    byPath: {},
    byId: {},
    byDay: {},
  },
};

interface FileIndex {
  path: string;
  taskEntries?: TaskEntry[];
  logEntries?: LogEntry[];
}

interface FileDeletedPayload {
  path: string;
}

export const trackerSlice = createAppSlice({
  name: "tracker",
  initialState,
  reducers: (create) => ({
    indexRequested: create.reducer(
      (state, action: PayloadAction<string[]>) => {},
    ),
    fileDeleted: create.reducer(
      (state, action: PayloadAction<FileDeletedPayload>) => {
        const { path } = action.payload;

        const taskEntryIds = state.taskEntries.byPath[path] || [];

        taskEntryIds.forEach((id) => {
          delete state.taskEntries.byId[id];
        });

        delete state.taskEntries.byPath[path];

        // todo: copypasted
        const logEntryIds = state.logEntries.byPath[path] || [];

        logEntryIds.forEach((id) => {
          const logEntry = state.logEntries.byId[id];

          isNotVoid(logEntry, "Inconsistent store state");

          logEntry.dayKeys.forEach((dayKey) => {
            isNotVoid(
              state.logEntries.byDay[dayKey],
              "Inconsistent store state",
            );

            state.logEntries.byDay[dayKey] = state.logEntries.byDay[
              dayKey
            ].filter((it) => it !== id);
          });
        });

        logEntryIds.forEach((id) => {
          delete state.logEntries.byId[id];
        });

        delete state.logEntries.byPath[path];
      },
    ),
    filesIndexed: create.reducer(
      (state, action: PayloadAction<FileIndex[]>) => {
        const fileIndexes = action.payload;

        fileIndexes.forEach((fileIndex) => {
          const { path, taskEntries = [], logEntries = [] } = fileIndex;

          // todo: repeat for logEntries
          const previousTaskEntryIds = state.taskEntries.byPath[path] || [];

          previousTaskEntryIds.forEach((id) => {
            delete state.taskEntries.byId[id];
          });

          // todo: copy pasta
          state.taskEntries.byPath[path] = taskEntries.map((it) => it.id);

          taskEntries.forEach((it) => {
            state.taskEntries.byId[it.id] = it;
          });

          const previousLogEntryIds = state.logEntries.byPath[path] || [];

          previousLogEntryIds.forEach((id) => {
            const logEntry = state.logEntries.byId[id];

            isNotVoid(logEntry, "Inconsistent store state");

            logEntry.dayKeys.forEach((dayKey) => {
              isNotVoid(
                state.logEntries.byDay[dayKey],
                "Inconsistent store state",
              );

              state.logEntries.byDay[dayKey] = state.logEntries.byDay[
                dayKey
              ].filter((it) => it !== id);
            });
          });

          previousLogEntryIds.forEach((id) => {
            delete state.logEntries.byId[id];
          });

          // todo: copy pasta
          state.logEntries.byPath[path] = logEntries.map((it) => it.id);

          logEntries.forEach((it) => {
            state.logEntries.byId[it.id] = it;
          });

          logEntries.forEach((logEntry) => {
            logEntry.dayKeys.forEach((dayKey) => {
              (state.logEntries.byDay[dayKey] ??= []).push(logEntry.id);
            });
          });
        });
      },
    ),
  }),
  selectors: {
    selectEntriesForPath: (state, path) => {
      return state.taskEntries.byPath[path]?.map(
        (it) => state.taskEntries.byId[it],
      );
    },
    // todo: should be memoized or stored in the index
    selectActiveClocks: (state) =>
      Object.values(state.logEntries.byId)
        .flat()
        .filter((it) => !it.end)
        .map((logEntry) => {
          const taskEntry = state.taskEntries.byId[logEntry.parent];

          isNotVoid(taskEntry, "Inconsistent store state");

          return logEntryToLocalTask(logEntry, taskEntry);
        }),
    selectListPropsPosition: (state, path: string, line: number) => {
      const taskEntriesForFile = state.taskEntries.byPath[path]?.map(
        (it) => state.taskEntries.byId[it],
      );

      const taskEntryAtLine = taskEntriesForFile?.find(
        // todo: redux should not keep explicit undefined here
        // todo: this is broken for line 0
        (it) => it?.position.start.line && it.position.start.line === line,
      );

      return taskEntryAtLine?.propsPosition;
    },
    selectLogEntriesByDay: (state) => state.logEntries.byDay,
    selectLogEntriesById: (state) => state.logEntries.byId,
    selectTaskEntriesById: (state) => state.taskEntries.byId,
    selectPlanEntriesByDay: (state) => state.planEntries.byDay,
    selectPlanEntriesById: (state) => state.planEntries.byId,
  },
});

export function logEntryToLocalTask(logEntry: LogEntry, taskEntry: TaskEntry) {
  return {
    text: taskEntry.text,
    location: { path: taskEntry.path, position: taskEntry.position },
    symbol: "-",
    startTime: strictParse(logEntry.start),
    durationMinutes: 30,
    id: logEntry.id,
  };
}

export const { filesIndexed, indexRequested, fileDeleted } =
  trackerSlice.actions;

export const {
  selectEntriesForPath,
  selectActiveClocks,
  selectLogEntriesByDay,
  selectLogEntriesById,
  selectListPropsPosition,
  selectPlanEntriesById,
  selectPlanEntriesByDay,
  selectTaskEntriesById,
} = trackerSlice.selectors;

type IndexRequested = ReturnType<typeof indexRequested>;

const idSeparator = "::";

export function createId(...args: (string | number)[]) {
  return args.join(idSeparator);
}

// todo: move
type TaskCache = ListItemCache & { task: string };

// todo: Move
function isTaskCache(listItemCache: ListItemCache): listItemCache is TaskCache {
  return listItemCache.task !== undefined;
}

// todo: move
function getTextAtPosition(inputText: string, position: Pos) {
  return inputText.slice(position.start.offset, position.end.offset);
}

type PartialPos = Omit<Pos, "end"> & { end?: Loc };

function isInside(inner: Pos, outer: PartialPos) {
  const innerStartIsInside = inner.start.offset >= outer.start.offset;

  if (!outer.end) {
    return innerStartIsInside;
  }

  return innerStartIsInside && inner.end.offset <= outer.end.offset;
}

function getHeadingSectionPosition(cache: CachedMetadata, headingText: string) {
  const { headings } = cache;

  if (!headings) {
    return undefined;
  }

  const targetIndex = headings.findIndex((h) => h.heading === headingText);

  if (targetIndex === -1) {
    return undefined;
  }

  const target = headings[targetIndex];

  const nextBoundary = headings
    .slice(targetIndex + 1)
    .find((heading) => heading.level <= target.level);

  return {
    start: target.position.start,
    end: nextBoundary?.position.start,
  };
}

export function createIndexListener(props: {
  listPropsParser: ListPropsParser;
  vault: Vault;
  metadataCache: MetadataCache;
  periodicNotes: PeriodicNotes;
  settings: DayPlannerSettings;
}): AppListenerEffect<IndexRequested> {
  const { listPropsParser, metadataCache, vault, periodicNotes, settings } =
    props;

  function createLogEntry(props: {
    start: string;
    end?: string;
    parent: string;
    id: string;
  }) {
    const { start, end, parent, id } = props;

    const parsedStart = strictParse(start);

    const parsedEnd = end
      ? strictParse(end)
      : // TODO: P3 bug
        //  Solution 1: dispatch dayChanged() and update active clocks then; simple & works
        //  Solution 2: calculate dayKeys for active clocks on the fly in selectActiveClocks selector
        //  Solution 3: use sorted array instead of buckets
        window.moment();

    const dayKeys: string[] = getDaysInRange(parsedStart, parsedEnd).map(
      (day) => day.format(defaultDayFormat),
    );

    return { start, end, parent, dayKeys, id };
  }

  function getTaskEntries(
    tasks: Array<TaskCache>,
    contents: string,
    path: string,
  ) {
    return tasks.map((task) => {
      const taskText = getTextAtPosition(contents, task.position);
      const firstLine = taskText.split("\n")[0];

      isNotVoid(
        firstLine,
        "Inconsistent metadata cache state: the first line of any list cannot be empty",
      );

      const listItemProps = listPropsParser.getListPropsFromListItem(
        task,
        taskText,
      );

      const taskEntryId = createId(path, task.position.start.line);

      const logEntries = listItemProps?.parsed.planner?.log?.map(
        ({ start, end }, index) =>
          createLogEntry({
            start,
            end,
            parent: taskEntryId,
            id: createId(taskEntryId, index),
          }),
      );

      return {
        id: taskEntryId,
        text: firstLine,
        position: task.position,
        propsPosition: listItemProps?.position,
        path,
        logEntries,
      };
    });
  }

  function getRelevantListItemsCache(cache: CachedMetadata) {
    if (settings.plannerHeading.length === 0) {
      return cache.listItems;
    }

    const plannerHeadingSectionPosition = getHeadingSectionPosition(
      cache,
      settings.plannerHeading,
    );

    if (!plannerHeadingSectionPosition) {
      return [];
    }

    return cache.listItems?.filter((listItem) =>
      isInside(listItem.position, plannerHeadingSectionPosition),
    );
  }

  function getPlanEntriesFromDailyNote(props: {
    cache: CachedMetadata;
    contents: string;
    path: string;
    date: Moment;
  }) {
    const { cache, contents, path, date } = props;

    const relevantListItemsCache = getRelevantListItemsCache(cache)?.map(
      (listItem) => {
        const listItemText = getTextAtPosition(contents, listItem.position);
        const firstLine = listItemText.split("\n")[0];

        const time = getTimeFromLine({
          line: firstLine,
          day: date,
        });

        if (!time) {
          return undefined;
        }

        const { startTime, durationMinutes } = time;

        return {
          start: startTime,
          end: getEndTime({
            startTime,
            durationMinutes: durationMinutes ? durationMinutes : 30,
          }),
        };
      },
    );
  }

  async function indexFile(path: string) {
    const cache = metadataCache.getCache(path);

    // todo: we don't need this
    const tasks = cache?.listItems?.filter(isTaskCache);

    if (!tasks || !cache) {
      return {
        taskEntries: [],
        logEntries: [],
      };
    }

    const file = vault.getFileByPath(path);

    isNotVoid(
      file,
      "Inconsistent app state: indexing requested for a non-existent file",
    );

    const contents = await vault.cachedRead(file);

    const denormalizedEntries = getTaskEntries(tasks, contents, path);

    const dateFromPath = periodicNotes.getDateFromPath(path, "day");

    if (dateFromPath) {
      const planEntries = getPlanEntriesFromDailyNote({
        cache,
        contents,
        path,
        date: dateFromPath,
      });
    }

    return {
      taskEntries: denormalizedEntries.map(({ logEntries, ...rest }) => ({
        logEntries: logEntries?.map((it) => it.id),
        ...rest,
      })),
      logEntries: denormalizedEntries.flatMap((it) => it.logEntries || []),
    };
  }

  return async function onIndexRequested(action, listenerApi) {
    const paths = action.payload;

    const normalizedEntriesForPaths = paths.map(async (path) => {
      try {
        const normalizedEntries = await indexFile(path);

        return {
          path,
          ...normalizedEntries,
        };
      } catch (error) {
        console.error(error);

        return undefined;
      }
    });

    const resolved = (await Promise.all(normalizedEntriesForPaths)).filter(
      (entries) => entries !== undefined,
    );

    listenerApi.dispatch(filesIndexed(resolved));
  };
}
