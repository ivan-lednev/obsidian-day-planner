import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { DataviewApi } from "obsidian-dataview";

import Day from "../day";
import { PlannedItem, PlannedItemLoader } from "../planned-items";

export default class DailyNotesItemLoader
  implements PlannedItemLoader<PlannedItem>
{
  constructor(private dataview: DataviewApi) {}

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
        tasks.filter((item) => !item.task || (item.task && !item.scheduled)),
      );
    }

    return result;
  }
}
