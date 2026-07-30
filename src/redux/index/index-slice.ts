import { type PayloadAction } from "@reduxjs/toolkit";
import type { MetadataCache, Pos, Vault } from "obsidian";
import { isNotVoid } from "typed-assert";

import type {
  FileIndexContribution,
  IndexService,
} from "../../service/index/index-service";
import { createAppSlice } from "../create-app-slice";
import type { AppListenerEffect } from "../store";

export interface FileSystemEntry {
  id: string;
  text: string;
  path: string;
}

export interface ListItemEntry extends FileSystemEntry {
  task?: string;
  symbol: string;
  position: Pos;
  propsPosition?: Pos;
  childIds?: string[];
  logEntryIds?: string[];
  planEntryIds?: string[];
}

export type DenormalizedListItemEntry = Omit<
  ListItemEntry,
  "logEntryIds" | "planEntryIds" | "childIds"
> & {
  logEntries: LogEntry[];
  planEntries: PlanEntry[];
  children: DenormalizedListItemEntry[];
};

export interface LogEntry {
  id: string;
  parentId: string;
  start: string;
  end?: string;
  dayKeys: string[];
  source: "listItemLog" | "frontmatterLog";
}

// todo: add RunningLogEntry
export interface ClosedLogEntry extends LogEntry {
  end: string;
}

export interface PlanEntry {
  isAllDay?: boolean;

  id: string;
  parentId: string;
  start: string;
  end: string;
  dayKeys: string[];
  source: "dailyNoteDate" | "tasksPluginProp";
}

interface IndexSliceState {
  listItemEntries: {
    byId: Record<string, ListItemEntry>;
    byPath: Record<string, string[]>;
  };
  fileEntries: {
    byId: Record<string, FileSystemEntry>;
    byPath: Record<string, string[]>;
  };
  logEntries: {
    byId: Record<string, LogEntry>;
    byPath: Record<string, string[]>;
    byDay: Record<string, Record<string, true>>;
  };
  planEntries: {
    byId: Record<string, PlanEntry>;
    byPath: Record<string, string[]>;
    byDay: Record<string, Record<string, true>>;
  };
}

const initialState: IndexSliceState = {
  listItemEntries: { byPath: {}, byId: {} },
  fileEntries: { byPath: {}, byId: {} },
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
  listItemEntries?: ListItemEntry[];
  fileEntries?: FileSystemEntry[];
  logEntries?: LogEntry[];
  planEntries?: PlanEntry[];
}

interface FileDeletedPayload {
  path: string;
}

export const indexSlice = createAppSlice({
  name: "tracker",
  initialState,
  reducers: (create) => ({
    indexRequested: create.reducer(
      (state, action: PayloadAction<string[]>) => {},
    ),
    fileDeleted: create.reducer(
      (state, action: PayloadAction<FileDeletedPayload>) => {
        const { path } = action.payload;

        const listItemEntryIds = state.listItemEntries.byPath[path] || [];

        listItemEntryIds.forEach((id) => {
          delete state.listItemEntries.byId[id];
        });

        delete state.listItemEntries.byPath[path];

        const fileEntryIds = state.fileEntries.byPath[path] || [];

        fileEntryIds.forEach((id) => {
          delete state.fileEntries.byId[id];
        });

        delete state.fileEntries.byPath[path];

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
          const {
            path,
            listItemEntries,
            fileEntries,
            logEntries,
            planEntries,
          } = fileIndex;

          // todo: repeat for logEntries
          const previousListItemEntryIds =
            state.listItemEntries.byPath[path] || [];

          previousListItemEntryIds.forEach((id) => {
            delete state.listItemEntries.byId[id];
          });

          // todo: copy pasta
          if (listItemEntries) {
            state.listItemEntries.byPath[path] = listItemEntries.map(
              (it) => it.id,
            );

            listItemEntries.forEach((it) => {
              state.listItemEntries.byId[it.id] = it;
            });
          }

          const previousFileEntryIds = state.fileEntries.byPath[path] || [];

          previousFileEntryIds.forEach((id) => {
            delete state.fileEntries.byId[id];
          });

          if (fileEntries) {
            state.fileEntries.byPath[path] = fileEntries.map((it) => it.id);

            fileEntries.forEach((it) => {
              state.fileEntries.byId[it.id] = it;
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
      return state.listItemEntries.byPath[path]?.map(
        (it) => state.listItemEntries.byId[it],
      );
    },
    selectListPropsPosition: (state, path: string, line: number) => {
      const listItemEntriesForFile = state.listItemEntries.byPath[path]?.map(
        (it) => state.listItemEntries.byId[it],
      );

      const listItemEntryAtLine = listItemEntriesForFile?.find(
        // todo: redux should not keep explicit undefined here
        // todo: this is broken for line 0
        (it) => it?.position.start.line && it.position.start.line === line,
      );

      return listItemEntryAtLine?.propsPosition;
    },
    selectLogEntriesByDay: (state) => state.logEntries.byDay,
    selectLogEntriesById: (state) => state.logEntries.byId,
    selectListItemEntriesById: (state) => state.listItemEntries.byId,
    selectFileEntriesById: (state) => state.fileEntries.byId,
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

export const { filesIndexed, indexRequested, fileDeleted } = indexSlice.actions;

export const {
  selectEntriesForPath,
  selectLogEntriesByDay,
  selectLogEntriesById,
  selectListPropsPosition,
  selectPlanEntriesById,
  selectPlanEntriesByDay,
  selectListItemEntriesById,
  selectFileEntriesById,
} = indexSlice.selectors;

type IndexRequested = ReturnType<typeof indexRequested>;

const idSeparator = "::";

export function createId(...args: (string | number)[]) {
  return args.join(idSeparator);
}

export function createListItemEntryId(path: string, line: number) {
  return createId(path, line);
}

export function createFileEntryId(path: string) {
  return createId(path, "frontmatter");
}

function mergeContributions(
  path: string,
  contributions: FileIndexContribution[],
): FileIndex {
  return contributions.reduce<FileIndex>(
    (acc, contribution) => ({
      path,
      listItemEntries: [
        ...(acc.listItemEntries ?? []),
        ...(contribution.listItemEntries ?? []),
      ],
      fileEntries: [
        ...(acc.fileEntries ?? []),
        ...(contribution.fileEntries ?? []),
      ],
      logEntries: [
        ...(acc.logEntries ?? []),
        ...(contribution.logEntries ?? []),
      ],
      planEntries: [
        ...(acc.planEntries ?? []),
        ...(contribution.planEntries ?? []),
      ],
    }),
    { path },
  );
}

export function createIndexListener(props: {
  vault: Vault;
  metadataCache: MetadataCache;
  indexServices: IndexService[];
}): AppListenerEffect<IndexRequested> {
  const { metadataCache, vault, indexServices } = props;

  return async function onIndexRequested(action, listenerApi) {
    const paths = action.payload;

    const normalizedEntriesForPaths = paths.map(async (path) => {
      try {
        const metadata = metadataCache.getCache(path);

        // todo: this is a leak: the orchestrator knows about indexer specifics
        if (!metadata?.listItems && !metadata?.frontmatter) {
          return undefined;
        }

        const file = vault.getFileByPath(path);

        isNotVoid(
          file,
          "Inconsistent app state: indexing requested for a non-existent file",
        );

        const text = await vault.cachedRead(file);

        const contributions = indexServices.map((service) =>
          service.index({ path, text, metadata }),
        );

        return mergeContributions(path, contributions);
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
