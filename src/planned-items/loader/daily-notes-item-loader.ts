import { TFile } from "obsidian";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataviewApi } from "obsidian-dataview";

import Day from "../day";
import { PlannedItem, PlannedItemLoader } from "../planned-items";

export default class DailyNotesItemLoader
  implements PlannedItemLoader<PlannedItem>
{
  constructor(
    private dataview: DataviewApi,
    private heading: string,
  ) {}

  public async forDays(days: Set<Day>): Promise<Map<Day, Array<PlannedItem>>> {
    const allDailyNotes = getAllDailyNotes();
    const result = new Map();

    for (const day of days) {
      result.set(day, this.itemsFor(day, allDailyNotes));
    }

    return result;
  }

  public setHeading(heading: string): void {
    this.heading = heading;
  }

  private itemsFor(
    day: Day,
    allDailyNotes: Record<string, TFile>,
  ): Array<PlannedItem> {
    const dailyNote = getDailyNote(window.moment(day.asIso()), allDailyNotes);
    if (dailyNote === null) {
      return [];
    }

    const note = this.dataview.page(dailyNote.basename);
    if (typeof note === "undefined") {
      return [];
    }

    return note.file.lists.values.filter((item: PlannedItem) =>
      this.isValidItem(item),
    );
  }

  private isValidItem(item: PlannedItem): boolean {
    return (
      this.inCorrectSection(item) &&
      this.istopLevelItem(item) &&
      this.isListItemOrUnscheduledTask(item)
    );
  }

  private inCorrectSection(item: PlannedItem): boolean {
    return item.section.subpath === this.heading;
  }

  private istopLevelItem(item: PlannedItem): boolean {
    return !item.parent;
  }

  private isListItemOrUnscheduledTask(item: PlannedItem): boolean {
    return !item.task || (item.task && !item.scheduled);
  }
}
