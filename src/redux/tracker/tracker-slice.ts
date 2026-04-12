import { type PayloadAction } from "@reduxjs/toolkit";
import { uniqBy } from "lodash/fp";
import type {
  CachedMetadata,
  ListItemCache,
  Loc,
  MetadataCache,
  Pos,
  Vault,
} from "obsidian";
import { isNotVoid, isRecordOfType } from "typed-assert";

import { clockFormat } from "../../constants";
import { getTimeFromLine } from "../../parser/parser";
import { listItemRegExp, shortScheduledPropRegExp } from "../../regexp";
import type { ListPropsParser } from "../../service/list-props-parser";
import type { PeriodicNotes } from "../../service/periodic-notes";
import type { DayPlannerSettings } from "../../settings";
import type { LocalTask } from "../../task-types";
import { getFirstLine } from "../../util/markdown";
import {
  getDayKeysInRange,
  getDiffInMinutes,
  strictParse,
} from "../../util/moment";
import { getDayKey, getEndTime } from "../../util/task-utils";
import { createAppSlice } from "../create-app-slice";
import type { AppListenerEffect } from "../store";

export interface ListItemEntry {
  id: string;
  text: string;
  task?: string;
  symbol: string;
  position: Pos;
  propsPosition?: Pos;
  path: string;
  children?: string[];
  logEntries?: string[];
  planEntries?: string[];
}

type DenormalizedListItemEntry = Omit<
  ListItemEntry,
  "logEntries" | "planEntries"
> & {
  logEntries: LogEntry[];
  planEntries: PlanEntry[];
  children: DenormalizedListItemEntry[];
};

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
  end?: string;
  parent: string;
  dayKeys: string[];
  id: string;
}

interface IndexSliceState {
  taskEntries: {
    byId: Record<string, ListItemEntry>;
    byPath: Record<string, string[]>;
  };
  logEntries: {
    byId: Record<string, LogEntry>;
    byPath: Record<string, string[]>;
    byDay: Record<string, Record<string, true>>;
  };
  planEntries: {
    byId: Record<string, LogEntry>;
    byPath: Record<string, string[]>;
    byDay: Record<string, Record<string, true>>;
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
  taskEntries?: ListItemEntry[];
  logEntries?: LogEntry[];
  planEntries?: PlanEntry[];
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

            delete state.logEntries.byDay[dayKey]?.[id];
          });
        });

        logEntryIds.forEach((id) => {
          delete state.logEntries.byId[id];
        });

        delete state.logEntries.byPath[path];

        // todo: copy pasta
        const planEntryIds = state.planEntries.byPath[path] || [];

        planEntryIds.forEach((id) => {
          const planEntry = state.planEntries.byId[id];

          isNotVoid(planEntry, "Inconsistent store state");

          planEntry.dayKeys.forEach((dayKey) => {
            isNotVoid(
              state.planEntries.byDay[dayKey],
              "Inconsistent store state",
            );

            delete state.planEntries.byDay[dayKey]?.[id];
          });
        });

        planEntryIds.forEach((id) => {
          delete state.planEntries.byId[id];
        });

        delete state.planEntries.byPath[path];
      },
    ),
    filesIndexed: create.reducer(
      (state, action: PayloadAction<FileIndex[]>) => {
        const fileIndexes = action.payload;

        fileIndexes.forEach((fileIndex) => {
          const { path, taskEntries, logEntries, planEntries } = fileIndex;

          // todo: repeat for logEntries
          const previousTaskEntryIds = state.taskEntries.byPath[path] || [];

          previousTaskEntryIds.forEach((id) => {
            delete state.taskEntries.byId[id];
          });

          // todo: copy pasta
          if (taskEntries) {
            state.taskEntries.byPath[path] = taskEntries.map((it) => it.id);

            taskEntries.forEach((it) => {
              state.taskEntries.byId[it.id] = it;
            });
          }

          const previousLogEntryIds = state.logEntries.byPath[path] || [];

          previousLogEntryIds.forEach((id) => {
            const logEntry = state.logEntries.byId[id];

            isNotVoid(logEntry, "Inconsistent store state");

            logEntry.dayKeys.forEach((dayKey) => {
              isNotVoid(
                state.logEntries.byDay[dayKey],
                "Inconsistent store state",
              );

              delete state.logEntries.byDay[dayKey]?.[id];
            });
          });

          previousLogEntryIds.forEach((id) => {
            delete state.logEntries.byId[id];
          });

          // todo: copy pasta
          if (logEntries) {
            state.logEntries.byPath[path] = logEntries.map((it) => it.id);

            logEntries.forEach((it) => {
              state.logEntries.byId[it.id] = it;
            });

            logEntries.forEach((logEntry) => {
              logEntry.dayKeys.forEach((dayKey) => {
                (state.logEntries.byDay[dayKey] ??= {})[logEntry.id] = true;
              });
            });
          }

          // todo: copy pasta

          const previousPlanEntryIds = state.planEntries.byPath[path] || [];

          previousPlanEntryIds.forEach((id) => {
            const planEntry = state.planEntries.byId[id];

            isNotVoid(planEntry, "Inconsistent store state");

            planEntry.dayKeys.forEach((dayKey) => {
              isNotVoid(
                state.planEntries.byDay[dayKey],
                "Inconsistent store state",
              );

              delete state.planEntries.byDay[dayKey]?.[id];
            });
          });

          previousPlanEntryIds.forEach((id) => {
            delete state.planEntries.byId[id];
          });

          if (planEntries) {
            state.planEntries.byPath[path] = planEntries.map((it) => it.id);

            planEntries.forEach((it) => {
              state.planEntries.byId[it.id] = it;
            });

            planEntries.forEach((logEntry) => {
              logEntry.dayKeys.forEach((dayKey) => {
                (state.planEntries.byDay[dayKey] ??= {})[logEntry.id] = true;
              });
            });
          }
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
    selectActiveLogEntries: (state) =>
      Object.values(state.logEntries.byId)
        .flat()
        .filter((it) => !it.end)
        .map((logEntry) => {
          const taskEntry = state.taskEntries.byId[logEntry.parent];

          isNotVoid(taskEntry, "Inconsistent store state");

          return planEntryToLocalTask(logEntry, taskEntry);
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

export type ListItemEntryWithChildren = Omit<
  DenormalizedListItemEntry,
  "children"
> & {
  children?: ListItemEntryWithChildren[];
};

export function planEntryToLocalTask(
  logEntry: PlanEntry,
  listItemEntry: ListItemEntry,
  // todo: remove previous one
  listItemEntryWithChildren?: ListItemEntryWithChildren,
): LocalTask {
  const startTime = strictParse(logEntry.start);
  const durationMinutes = logEntry.end
    ? getDiffInMinutes(strictParse(logEntry.end), startTime)
    : // todo: use settings OR logic from dataview code
      30;

  return {
    status: listItemEntry.task,
    text: listItemEntry.text,
    location: { path: listItemEntry.path, position: listItemEntry.position },
    symbol: listItemEntry.symbol,
    startTime,
    durationMinutes,
    id: logEntry.id,
    isAllDayEvent: logEntry.isAllDay,
    children: listItemEntryWithChildren?.children,
  };
}

export const { filesIndexed, indexRequested, fileDeleted } =
  trackerSlice.actions;

export const {
  selectEntriesForPath,
  selectActiveLogEntries,
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

// todo: move to metadata-utils
function isInside(inner: Pos, outer: PartialPos) {
  const innerStartIsInside = inner.start.offset >= outer.start.offset;

  if (!outer.end) {
    return innerStartIsInside;
  }

  return innerStartIsInside && inner.end.offset <= outer.end.offset;
}

function flatten<T extends { children?: T[]; id: string }>(
  node: T,
): Array<Omit<T, "children"> & { children?: string[] }> {
  const { children, ...rest } = node;

  return [
    {
      ...rest,
      ...(children
        ? { children: (children ?? []).map((child) => child.id) }
        : {}),
    },
    ...(children ?? []).flatMap(flatten),
  ];
}

// todo: move to metadata utils
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

  isNotVoid(target);

  const nextBoundary = headings
    .slice(targetIndex + 1)
    .find((heading) => heading.level <= target.level);

  return {
    start: target.position.start,
    end: nextBoundary?.position.start,
  };
}

function createLineToChildrenLookup(listItems: ListItemCache[]) {
  return listItems.reduce<Record<number, ListItemCache[]>>((result, item) => {
    if (item.parent < 0) {
      return result;
    }

    (result[item.parent] ??= []).push(item);

    return result;
  }, {});
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
        //  Solution 2: calculate dayKeys for active clocks on the fly in selectActiveLogEntries selector
        //  Solution 3: use sorted array instead of buckets
        window.moment();

    const dayKeys: string[] = getDayKeysInRange(parsedStart, parsedEnd);

    return { start, end, parent, dayKeys, id };
  }

  // todo: move out
  function isInsideDailyNoteParseScope(
    position: Pos,
    plannerHeadingSectionPosition?: PartialPos,
  ) {
    const shouldScanAllDailyNote = settings.plannerHeading.length === 0;

    if (shouldScanAllDailyNote) {
      return true;
    }

    return (
      plannerHeadingSectionPosition &&
      isInside(position, plannerHeadingSectionPosition)
    );
  }

  function parseObsidianTasksScheduledDate(line: string) {
    const datePropMatch = line.match(shortScheduledPropRegExp);

    if (!datePropMatch) {
      return undefined;
    }

    isRecordOfType<string>(
      datePropMatch.groups,
      (value) => typeof value === "string",
      "Mismatching named regexp groups",
    );

    const dateString = datePropMatch.groups["date"];

    isNotVoid(dateString);

    return strictParse(dateString);
  }

  function getObsidianTasksEntries(props: {
    firstLine: string;
    parentId: string;
  }): PlanEntry[] {
    const { firstLine, parentId } = props;

    const scheduledDate = parseObsidianTasksScheduledDate(firstLine);

    if (!scheduledDate) {
      return [];
    }

    const result = {
      id: createId(parentId, "tasks-scheduled"),
      dayKeys: [getDayKey(scheduledDate)],
      // todo P3: we can add parent id later
      parent: parentId,
    };

    const time = getTimeFromLine({
      line: firstLine,
      day: scheduledDate,
    });

    if (!time) {
      return [
        {
          ...result,
          start: scheduledDate.format(clockFormat),
          end: scheduledDate.clone().add(1, "hour").format(clockFormat),
          isAllDay: true,
        },
      ];
    }

    return [
      {
        ...result,
        start: time.startTime.format(clockFormat),
        // todo: duplication
        end: getEndTime({
          startTime: time.startTime,
          durationMinutes:
            time.durationMinutes ?? settings.defaultDurationMinutes,
        }).format(clockFormat),
      },
    ];
  }

  function parseListItemLine(line: string) {
    const match = line.match(listItemRegExp);

    isRecordOfType<string>(
      match?.groups,
      (value) => typeof value === "string",
      "Mismatching named regexp groups",
    );

    const { symbol, text = "", task } = match.groups;

    isNotVoid(symbol);

    return { task, symbol, text: text.trim() };
  }

  function createListItemEntry(props: {
    path: string;
    contents: string;
    listItemCache: ListItemCache;
  }) {
    const { path, listItemCache, contents } = props;

    const id = createId(path, listItemCache.position.start.line);

    const fullListItemText = getTextAtPosition(
      contents,
      listItemCache.position,
    );
    const rawFirstLine = getFirstLine(fullListItemText);

    const {
      text: firstLineText,
      symbol,
      task,
    } = parseListItemLine(rawFirstLine);

    const trimmedLinesAfterFirst = fullListItemText
      .split("\n")
      .slice(1)
      .map((line) => line.trim())
      .join("\n");

    const listItemTextInIndex =
      trimmedLinesAfterFirst.length > 0
        ? firstLineText + "\n" + trimmedLinesAfterFirst
        : firstLineText;

    return {
      id,
      text: listItemTextInIndex,
      symbol,
      task,
      position: listItemCache.position,
      path,
      children: [],
      logEntries: [],
      planEntries: [],
    };
  }

  function getListItemEntries(
    cache: CachedMetadata,
    contents: string,
    path: string,
  ) {
    const dateFromPath = periodicNotes.getDateFromPath(path, "day");
    const plannerHeadingSectionPosition = getHeadingSectionPosition(
      cache,
      settings.plannerHeading,
    );

    if (!cache.listItems) {
      return [];
    }

    const denormalizedListItemEntries = cache.listItems.reduce<
      DenormalizedListItemEntry[]
    >((result, listItemCache) => {
      const fullListItemText = getTextAtPosition(
        contents,
        listItemCache.position,
      );

      const listItemEntry: DenormalizedListItemEntry = createListItemEntry({
        path,
        contents,
        listItemCache,
      });

      if (
        dateFromPath &&
        isInsideDailyNoteParseScope(
          listItemCache.position,
          plannerHeadingSectionPosition,
        )
      ) {
        const time = getTimeFromLine({
          line: listItemEntry.text,
          day: dateFromPath,
        });
        const id = createId(listItemEntry.id, "daily");
        const dayKeys = [getDayKey(dateFromPath)];

        if (time) {
          const { startTime, durationMinutes } = time;
          const endTime = getEndTime({
            startTime,
            durationMinutes: durationMinutes ?? settings.defaultDurationMinutes,
          });

          listItemEntry.planEntries.push({
            id,
            dayKeys,
            parent: listItemEntry.id,
            start: startTime.format(clockFormat),
            end: endTime.format(clockFormat),
          });
        } else if (isTaskCache(listItemCache)) {
          listItemEntry.planEntries.push({
            id,
            dayKeys,
            parent: listItemEntry.id,
            start: dateFromPath.format(clockFormat),
            // todo: this is not needed
            end: dateFromPath
              .clone()
              .add(settings.defaultDurationMinutes, "minutes")
              .format(clockFormat),
            isAllDay: true,
          });
        }
      }

      if (isTaskCache(listItemCache)) {
        // todo: new ObsidianTasksIndexer()
        const obsidianTasksEntries = getObsidianTasksEntries({
          firstLine: listItemEntry.text,
          parentId: listItemEntry.id,
        });

        listItemEntry.planEntries.push(...obsidianTasksEntries);

        // todo: new PropsIndexer
        const listItemProps = listPropsParser.getListPropsFromListItem(
          listItemCache,
          fullListItemText,
        );

        // todo: cut out props here, use removeWithin(text: string, outer: Pos, inner: Pos)

        listItemEntry.propsPosition = listItemProps?.position;
        listItemEntry.logEntries =
          listItemProps?.parsed.planner?.log?.map(({ start, end }, index) =>
            createLogEntry({
              start,
              end,
              parent: listItemEntry.id,
              id: createId(listItemEntry.id, index),
            }),
          ) || [];
      }

      if (
        listItemEntry.planEntries.length > 0 ||
        listItemEntry.logEntries.length > 0
      ) {
        result.push(listItemEntry);
      }

      return result;
    }, []);

    if (denormalizedListItemEntries.length === 0) {
      return denormalizedListItemEntries;
    }

    // tree-building for nested list item operations

    const lineToChildrenLookup = createLineToChildrenLookup(cache.listItems);
    const idToListItemEntry = denormalizedListItemEntries.reduce<
      Record<string, DenormalizedListItemEntry>
    >((result, current) => {
      result[current.id] = current;

      return result;
    }, {});

    // todo: move out
    function createTree(
      listItemEntry: DenormalizedListItemEntry,
    ): ListItemEntryWithChildren {
      return {
        ...listItemEntry,
        children:
          lineToChildrenLookup[listItemEntry.position.start.line]?.map(
            (listItemCache) => {
              const id = createId(path, listItemCache.position.start.line);
              const previouslyIndexed = idToListItemEntry[id];
              const listItemEntry =
                previouslyIndexed ||
                createListItemEntry({ path, listItemCache, contents });

              return createTree(listItemEntry);
            },
          ) || [],
      };
    }

    // add children recursively
    return denormalizedListItemEntries.map((listItemEntry) => {
      return createTree(listItemEntry);
    });
  }

  async function indexFile(path: string) {
    const cache = metadataCache.getCache(path);

    if (!cache?.listItems) {
      return undefined;
    }

    const file = vault.getFileByPath(path);

    isNotVoid(
      file,
      "Inconsistent app state: indexing requested for a non-existent file",
    );

    const contents = await vault.cachedRead(file);

    const denormalizedEntries = getListItemEntries(cache, contents, path);

    const flatListItemEntries = uniqBy(
      (it) => it.id,
      denormalizedEntries.flatMap(flatten),
    );

    // todo: move into a separate function
    return {
      taskEntries: flatListItemEntries?.map(
        ({ logEntries, planEntries, ...rest }) => ({
          logEntries: logEntries?.map((it) => it.id),
          planEntries: planEntries?.map((it) => it.id),
          ...rest,
        }),
      ),
      logEntries: denormalizedEntries.flatMap((it) => it.logEntries || []),
      planEntries: denormalizedEntries.flatMap((it) => it.planEntries || []),
    };
  }

  return async function onIndexRequested(action, listenerApi) {
    const paths = action.payload;

    const normalizedEntriesForPaths = paths.map(async (path) => {
      try {
        const normalizedEntries = await indexFile(path);

        if (normalizedEntries) {
          return {
            path,
            ...normalizedEntries,
          };
        }
      } catch (error) {
        console.error(
          new Error(`Failed to parse file ${path}`, { cause: error }),
        );
      }

      return undefined;
    });

    const resolved = (await Promise.all(normalizedEntriesForPaths)).filter(
      (entries) => entries !== undefined,
    );

    listenerApi.dispatch(filesIndexed(resolved));
  };
}
