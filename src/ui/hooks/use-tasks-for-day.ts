import { Moment } from "moment";
import { getAllDailyNotes, getDailyNote } from "obsidian-daily-notes-interface";
import { STask } from "obsidian-dataview";
import { derived, Readable } from "svelte/store";

import { addPlacing } from "../../overlap/overlap";
import { timeRegExp } from "../../regexp";
import { sTaskToPlanItem } from "../../service/dataview-facade";
import { PlanItem } from "../../types";

interface UseTaskSourceProps {
  day: Readable<Moment>;
  dataviewTasks: Readable<STask[]>;
}

export function useTasksForDay({ day, dataviewTasks }: UseTaskSourceProps) {
  return derived([day, dataviewTasks], ([$day, $dataviewTasks]) => {
    const noteForDay = getDailyNote($day, getAllDailyNotes());
    const tasksForDay = $dataviewTasks
      // @ts-expect-error
      .where((task: STask) => {
        if (!timeRegExp.test(task.text)) {
          return false;
        }

        if (task.path === noteForDay?.path) {
          return true;
        }

        if (!task.scheduled) {
          return false;
        }

        const scheduledMoment = window.moment(task.scheduled.toMillis());

        return scheduledMoment.isSame($day, "day");
      })
      .map((sTask: STask) => sTaskToPlanItem(sTask, $day))
      .sort((task: PlanItem) => task.startMinutes)
      .array();

    return addPlacing(tasksForDay);
  });
}
