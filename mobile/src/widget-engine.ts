import {
  readStoredActivities,
  prepareActivityCommand,
  type AppendActivityNoteCommand,
} from "../../src/shared/activity";
import {
  buildActivityDayTimeline,
  buildActivityActiveClocks,
} from "../../src/shared/activity-timeline";
import { activityYaml } from "./lib/activity-files";

// A short-lived, offline WebView runs the actual shared TypeScript for native widgets.
// The native result callback has no file access; inputs and write plans are data.
Object.assign(window, {
  DayPlannerWidget: {
    async activityCommand(
      files: [string, string][],
      command: AppendActivityNoteCommand,
    ) {
      try {
        return {
          model: await prepareActivityCommand(files, activityYaml, command),
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Unable to update activity files",
        };
      }
    },
    activeClocks(
      files: [string, string][],
      _day: string,
      _now: number,
      dark: boolean,
    ) {
      try {
        return {
          model: buildActivityActiveClocks(
            readStoredActivities(files, activityYaml),
            dark,
          ),
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Unable to read activity files",
        };
      }
    },
    build(files: [string, string][], day: string, now: number, dark: boolean) {
      try {
        return {
          model: buildActivityDayTimeline(
            readStoredActivities(files, activityYaml),
            day,
            now,
            dark,
          ),
        };
      } catch (error) {
        return {
          error:
            error instanceof Error
              ? error.message
              : "Unable to read activity files",
        };
      }
    },
  },
});
