import { DataviewApi } from "obsidian-dataview";

import Day from "../day";
import { PlannedItem, PlannedItemLoader } from "../planned-items";

export default class ScheduledTasksLoader
  implements PlannedItemLoader<PlannedItem>
{
  constructor(private dataview: DataviewApi) {}

  public async forDays(days: Set<Day>): Promise<Map<Day, Array<PlannedItem>>> {
    const result = new Map();
    const tasks = await this.tasksScheduledFor(days);

    for (const day of days) {
      result.set(
        day,
        tasks.filter((task) => this.isScheduledFor(task, day)),
      );
    }

    return result;
  }

  private async tasksScheduledFor(days: Set<Day>): Promise<Array<PlannedItem>> {
    const queryResult = await this.dataview.query(this.taskQueryFor(days));
    if ("error" in queryResult) {
      console.error(`Error querying data: ${queryResult.error}`);
      return [];
    }

    return queryResult.value.values as Array<PlannedItem>;
  }

  private taskQueryFor(days: Set<Day>): string {
    const conditions = Array.from(days.values())
      .map((d) => `scheduled = date(${d.asIso()})`)
      .join(" OR ");

    return `TASK WHERE ${conditions}`;
  }

  private isScheduledFor(task: PlannedItem, day: Day): boolean {
    if (!task?.scheduled?.toMillis) {
      return false;
    }

    return day.equals(Day.fromMoment(window.moment(task.scheduled.toMillis())));
  }
}
