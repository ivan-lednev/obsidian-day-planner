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
      const dailyNote = getDailyNote(window.moment(day.asIso()), allDailyNotes);
      if (dailyNote === null) {
        result.set(day, []);
        continue;
      }

      const note = this.dataview.page(dailyNote.basename);

      const tasks: Array<PlannedItem> =
        typeof note === "undefined" ? [] : note.file.lists.values;

      result.set(
        day,
        tasks.filter((item) => this.isValidItem(item)),
      );
    }

    return result;
  }

  public setHeading(heading: string): void {
    this.heading = heading;
  }

  private isValidItem(item: PlannedItem): boolean {
    return (
      this.inCorrectSection(item) &&
      this.istopLevelItem(item) &&
      this.islistItemOrUnscheduledTask(item)
    );
  }

  private inCorrectSection(item: PlannedItem): boolean {
    return item.section.subpath === this.heading;
  }

  private istopLevelItem(item: PlannedItem): boolean {
    return !item.parent;
  }

  private islistItemOrUnscheduledTask(item: PlannedItem): boolean {
    return !item.task || (item.task && !item.scheduled);
  }
}
