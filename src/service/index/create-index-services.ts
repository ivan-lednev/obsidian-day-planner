import type { DayPlannerSettings } from "../../settings";
import type { ListPropsParser } from "../list-props-parser";
import type { PeriodicNotes } from "../periodic-notes";

import { DailyNoteExtensionService } from "./extensions/daily-note-extension-service";
import { ObsidianTasksExtensionService } from "./extensions/obsidian-tasks-extension-service";
import { TimeEntriesExtensionService } from "./extensions/time-entries-extension-service";
import { FrontmatterLogIndexService } from "./frontmatter-log-index-service";
import type { IndexService } from "./index-service";
import { ListItemIndexService } from "./list-item-index-service";

export function createIndexServices(props: {
  listPropsParser: ListPropsParser;
  periodicNotes: PeriodicNotes;
  settings: DayPlannerSettings;
}): IndexService[] {
  const { listPropsParser, periodicNotes, settings } = props;

  return [
    new ListItemIndexService([
      new DailyNoteExtensionService(periodicNotes, settings),
      new ObsidianTasksExtensionService(settings),
      new TimeEntriesExtensionService(listPropsParser),
    ]),
    new FrontmatterLogIndexService(),
  ];
}
