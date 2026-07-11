import { uniqBy } from "lodash/fp";
import type { CachedMetadata, ListItemCache, Pos } from "obsidian";
import { isNotVoid, isRecordOfType } from "typed-assert";

import { clockFormat } from "../constants";
import { getTimeFromLine } from "../parser/parser";
import {
  createId,
  type DenormalizedListItemEntry,
  type ListItemEntry,
  type ListItemEntryWithChildren,
  type LogEntry,
  type PlanEntry,
} from "../redux/index/index-slice";
import { listItemRegExp, scheduledPropRegExps } from "../regexp";
import type { DayPlannerSettings } from "../settings";
import { getFirstLine } from "../util/markdown";
import {
  createLineToChildrenLookup,
  getHeadingSectionPosition,
  getTextAtPosition,
  isInside,
  isTaskCache,
  type PartialPos,
} from "../util/metadata";
import { getDayKeysInRange, strictParse } from "../util/moment";
import { getDayKey, getEndTime } from "../util/task-utils";

import type { ListPropsParser } from "./list-props-parser";
import type { PeriodicNotes } from "./periodic-notes";

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

export class FileIndexParser {
  constructor(
    private readonly listPropsParser: ListPropsParser,
    private readonly periodicNotes: PeriodicNotes,
    private readonly settings: DayPlannerSettings,
  ) {}

  parse(input: { path: string; text: string; metadata: CachedMetadata }): {
    taskEntries: ListItemEntry[];
    logEntries: LogEntry[];
    planEntries: PlanEntry[];
  } {
    const { path, text, metadata } = input;

    const denormalizedEntries = this.getListItemEntries(metadata, text, path);

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

  private createLogEntry(props: {
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

  private isInsideDailyNoteParseScope(
    position: Pos,
    plannerHeadingSectionPosition?: PartialPos,
  ) {
    const shouldScanAllDailyNote = this.settings.plannerHeading.length === 0;

    if (shouldScanAllDailyNote) {
      return true;
    }

    return (
      plannerHeadingSectionPosition &&
      isInside(position, plannerHeadingSectionPosition)
    );
  }

  private parseScheduledDateFromInlineProp(line: string) {
    for (const regexp of scheduledPropRegExps) {
      const dateMatch = line.match(regexp)?.groups?.["date"];

      if (dateMatch) {
        return strictParse(dateMatch);
      }
    }
  }

  private getObsidianTasksEntries(props: {
    firstLine: string;
    parentId: string;
  }): PlanEntry[] {
    const { firstLine, parentId } = props;

    const scheduledDate = this.parseScheduledDateFromInlineProp(firstLine);

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
            time.durationMinutes ?? this.settings.defaultDurationMinutes,
        }).format(clockFormat),
      },
    ];
  }

  private parseListItemLine(line: string) {
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

  private createListItemEntry(props: {
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
    } = this.parseListItemLine(rawFirstLine);

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

  private getListItemEntries(
    cache: CachedMetadata,
    contents: string,
    path: string,
  ) {
    const dateFromPath = this.periodicNotes.getDateFromPath(path, "day");
    const plannerHeadingSectionPosition = getHeadingSectionPosition(
      cache,
      this.settings.plannerHeading,
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

      const listItemEntry: DenormalizedListItemEntry = this.createListItemEntry(
        {
          path,
          contents,
          listItemCache,
        },
      );

      if (
        dateFromPath &&
        this.isInsideDailyNoteParseScope(
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
            durationMinutes:
              durationMinutes ?? this.settings.defaultDurationMinutes,
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
              .add(this.settings.defaultDurationMinutes, "minutes")
              .format(clockFormat),
            isAllDay: true,
          });
        }
      }

      if (isTaskCache(listItemCache)) {
        // todo: new ObsidianTasksIndexer()
        const obsidianTasksEntries = this.getObsidianTasksEntries({
          firstLine: listItemEntry.text,
          parentId: listItemEntry.id,
        });

        listItemEntry.planEntries.push(...obsidianTasksEntries);

        // todo: new PropsIndexer
        const listItemProps = this.listPropsParser.getListPropsFromListItem(
          listItemCache,
          fullListItemText,
        );

        // todo: cut out props here, use removeWithin(text: string, outer: Pos, inner: Pos)

        listItemEntry.propsPosition = listItemProps?.position;
        listItemEntry.logEntries =
          listItemProps?.parsed.planner?.log?.map(({ start, end }, index) =>
            this.createLogEntry({
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
    const createTree = (
      listItemEntry: DenormalizedListItemEntry,
    ): ListItemEntryWithChildren => {
      return {
        ...listItemEntry,
        children:
          lineToChildrenLookup[listItemEntry.position.start.line]?.map(
            (listItemCache) => {
              const id = createId(path, listItemCache.position.start.line);
              const previouslyIndexed = idToListItemEntry[id];
              const listItemEntry =
                previouslyIndexed ||
                this.createListItemEntry({ path, listItemCache, contents });

              return createTree(listItemEntry);
            },
          ) || [],
      };
    };

    // add children recursively
    return denormalizedListItemEntries.map((listItemEntry) => {
      return createTree(listItemEntry);
    });
  }
}
