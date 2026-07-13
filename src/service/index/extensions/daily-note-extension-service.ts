import type { Pos } from "obsidian";

import { clockFormat } from "../../../constants";
import { getTimeFromLine } from "../../../parser/parser";
import { createId } from "../../../redux/index/index-slice";
import type { DayPlannerSettings } from "../../../settings";
import {
  getHeadingSectionPosition,
  isInside,
  isTaskCache,
  type PartialPos,
} from "../../../util/metadata";
import { getDayKey, getEndTime } from "../../../util/time-block-utils";
import type { PeriodicNotes } from "../../periodic-notes";
import type { FileWithMetadata } from "../index-service";
import type {
  ListItemIndexExtensionService,
  RawListItemEntryWithContext,
} from "../list-item-index-extension-service";

export class DailyNoteExtensionService
  implements ListItemIndexExtensionService
{
  constructor(
    private readonly periodicNotes: PeriodicNotes,
    private readonly settings: DayPlannerSettings,
  ) {}

  forFile(props: FileWithMetadata) {
    const { path, metadata } = props;

    const dateFromPath = this.periodicNotes.getDateFromPath(path, "day");
    const plannerHeadingSectionPosition = getHeadingSectionPosition(
      metadata,
      this.settings.plannerHeading,
    );

    return ({
      listItemCache,
      rawListItemEntry,
    }: RawListItemEntryWithContext) => {
      if (
        !dateFromPath ||
        !this.isInsideDailyNoteParseScope(
          listItemCache.position,
          plannerHeadingSectionPosition,
        )
      ) {
        return {};
      }

      const time = getTimeFromLine({
        line: rawListItemEntry.text,
        day: dateFromPath,
      });
      const id = createId(rawListItemEntry.id, "daily");
      const dayKeys = [getDayKey(dateFromPath)];

      if (time) {
        const { startTime, durationMinutes } = time;
        const endTime = getEndTime({
          startTime,
          durationMinutes:
            durationMinutes ?? this.settings.defaultDurationMinutes,
        });

        return {
          planEntries: [
            {
              id,
              dayKeys,
              parent: rawListItemEntry.id,
              start: startTime.format(clockFormat),
              end: endTime.format(clockFormat),
            },
          ],
        };
      }

      if (isTaskCache(listItemCache)) {
        return {
          planEntries: [
            {
              id,
              dayKeys,
              parent: rawListItemEntry.id,
              start: dateFromPath.format(clockFormat),
              // todo: this is not needed
              end: dateFromPath
                .clone()
                .add(this.settings.defaultDurationMinutes, "minutes")
                .format(clockFormat),
              isAllDay: true,
            },
          ],
        };
      }

      return {};
    };
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
}
