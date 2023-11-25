import { DataviewApi } from "obsidian-dataview";

import Day from "../day";
import { PlannedItem, PlannedItemLoader } from "../planned-items";

function isScheduledForThisDay(task: PlannedItem, day: Day) {
  if (!task?.scheduled?.toMillis) {
    return false;
  }

  return day.equals(Day.fromMoment(window.moment(task.scheduled.toMillis())));
}

export default class ScheduledTasksLoader
  implements PlannedItemLoader<PlannedItem>
{
  constructor(private dataview: DataviewApi) {}

  public async forDays(days: Set<Day>): Promise<Map<Day, Array<PlannedItem>>> {
    const result = new Map();

    const conditions = Array.from(days.values())
      .map((d) => `scheduled = date(${d.asIso()})`)
      .join(" OR ");

    const queryResult = await this.dataview.query(`TASK WHERE ${conditions}`);
    if ("error" in queryResult) {
      console.error(`Error querying data: ${queryResult.error}`);
      return result;
    }

    const dataviewTasks = queryResult.value.values as Array<PlannedItem>;

    for (const day of days) {
      const tasks = dataviewTasks.filter((task) =>
        isScheduledForThisDay(task, day),
      );

      result.set(day, tasks);
    }

    return result;
  }
}
