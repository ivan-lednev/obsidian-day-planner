import type { App } from "obsidian";

import { clockFormat } from "../constants";
import type { LocalTask } from "../task-types";
import { askForActivityAttributes } from "../ui/activity-attributes-modal";
import { askForConfirmation } from "../ui/confirmation-modal";
import { SingleSuggestModal } from "../ui/SingleSuggestModal";
import {
  activityNotesField,
  getActivityDisplayLabel,
  getActivityLabel,
  qualityRatingField,
} from "../util/activity-definitions";
import {
  getActivityAtLogLocation,
  getActivityLogEntries,
} from "../util/activity-log-location";
import {
  finishActivityRecord,
  getOpenActivityLog,
  getActivityFinishFields,
} from "../util/activity-workflow";
import {
  appendNoteToActivity,
  cancelActivityLogEntry,
  propsSchema,
  updateActivityDetails,
  updateActivityLogEntry,
  type Activity,
  type Props,
} from "../util/props";
import { withNotice } from "../util/with-notice";

import type { PlannerData } from "./planner-data";

type ActivityBlock = LocalTask & { clockActivity?: Activity };

/** UI actions operate on a selected weekly-file row and log row. */
export class ActivityEditor {
  constructor(
    private readonly app: App,
    private readonly plannerData: PlannerData,
  ) {}

  addNoteToClockActivity = withNotice(async (block: ActivityBlock) => {
    const values = await askForActivityAttributes(this.app, {
      title: "Add note to activity",
      fields: [activityNotesField],
    });
    if (typeof values?.notes !== "string" || !values.notes.trim()) return;
    await this.updateSelectedActivity(block, (props, index) =>
      appendNoteToActivity(props, index, values.notes as string),
    );
  });

  changeClockActivityStartTime = withNotice(async (block: ActivityBlock) => {
    await this.changeLogTime(block, "start");
  });

  changeClockActivityEndTime = withNotice(async (block: ActivityBlock) => {
    await this.changeLogTime(block, "end");
  });

  changeClockActivityRating = withNotice(async (block: ActivityBlock) => {
    const values = await askForActivityAttributes(this.app, {
      title: "Change rating",
      fields: [qualityRatingField],
      initialValues: { quality: block.clockActivity?.quality },
    });
    if (typeof values?.quality !== "number") return;
    await this.updateSelectedActivity(block, (props, index) =>
      updateActivityDetails(props, index, { quality: values.quality }),
    );
  });

  finishActivity = withNotice(async (block: ActivityBlock) => {
    if (!block.clockActivity)
      throw new Error("Select an activity from the weekly files");
    const activityName = block.clockActivity.activity;
    const values = await askForActivityAttributes(this.app, {
      title: `Finish ${getActivityLabel(activityName)}`,
      fields: getActivityFinishFields(activityName),
    });
    if (!values) return;
    await this.updateSelectedActivity(block, (props, index, logIndex) => ({
      ...props,
      activities: props.activities!.with(
        index,
        finishActivityRecord(
          props.activities![index],
          values,
          window.moment().format(clockFormat),
          props.activities![index].log![logIndex].start,
        ),
      ),
    }));
  });

  cancelActivity = withNotice(async (block: ActivityBlock) => {
    if (
      !(await askForConfirmation({
        app: this.app,
        title: "Cancel clock",
        text: "Are you sure you want to cancel this clock?",
        cta: "Cancel clock",
      }))
    )
      return;
    await this.updateSelectedActivity(block, (props, index, logIndex) =>
      cancelActivityLogEntry(props, index, logIndex),
    );
  });

  finishSelectedOpenActivity = withNotice(async () => {
    const block = await this.chooseOpenActivity("Finish activity");
    if (block) await this.finishActivity(block);
  });

  cancelSelectedOpenActivity = withNotice(async () => {
    const block = await this.chooseOpenActivity("Cancel activity");
    if (block) await this.cancelActivity(block);
  });

  addNoteToSelectedOpenActivity = withNotice(async () => {
    const block = await this.chooseOpenActivity("Add note to activity");
    if (block) await this.addNoteToClockActivity(block);
  });

  private async changeLogTime(block: ActivityBlock, key: "start" | "end") {
    const selected = block.clockActivity?.log?.[0];
    if (!selected) throw new Error("Cannot find selected activity log entry");
    const label = key === "start" ? "Start time" : "End time";
    const values = await askForActivityAttributes(this.app, {
      title: `Change ${label.toLowerCase()}`,
      fields: [{ key, label, type: "text", required: true }],
      initialValues: { [key]: selected[key] },
    });
    const value = values?.[key];
    if (typeof value !== "string") return;
    if (!window.moment(value, window.moment.ISO_8601, true).isValid())
      throw new Error(`${label} must be a valid timestamp`);
    await this.updateSelectedActivity(block, (props, index, logIndex) =>
      updateActivityLogEntry(props, index, logIndex, { [key]: value }),
    );
  }

  private async updateSelectedActivity(
    block: ActivityBlock,
    update: (
      props: Props,
      activityIndex: number,
      logEntryIndex: number,
    ) => Props,
  ) {
    const location = block.activityLocation;
    const activity = block.clockActivity;
    const log = activity?.log?.[0];
    if (!location || !activity || !log)
      throw new Error("Select an activity from the weekly files");
    await this.plannerData.updateActivities(location.path, (activities) => {
      getActivityAtLogLocation(activities, location, {
        activity: activity.activity,
        log,
      });
      return (
        propsSchema.parse(
          update(
            { activities },
            location.activityIndex,
            location.logEntryIndex,
          ),
        ).activities ?? []
      );
    });
  }

  private async chooseOpenActivity(
    title: string,
  ): Promise<ActivityBlock | undefined> {
    await this.plannerData.loadActivities();
    const suggestions = this.plannerData
      .getActivitiesWithLocations()
      .flatMap(({ path, activity, activityIndex }) =>
        getActivityLogEntries(path, [activity])
          .filter(({ activity, log }) => getOpenActivityLog(activity) === log)
          .map(({ log, activityLocation }) => {
            const text = `${getActivityDisplayLabel(activity.activity, activity)} — ${log.start} (${path}, activity ${activityIndex + 1}, log ${activityLocation.logEntryIndex + 1})`;
            return {
              text,
              block: {
                id: text,
                text,
                symbol: "-",
                status: " ",
                startTime: window.moment(log.start),
                durationMinutes: 0,
                clockActivity: { ...activity, log: [log] },
                activityLocation: { ...activityLocation, activityIndex },
              } satisfies ActivityBlock,
            };
          }),
      );
    if (!suggestions.length) throw new Error("There is no open clock");
    if (suggestions.length === 1) return suggestions[0].block;
    return new Promise((resolve) => {
      new SingleSuggestModal({
        app: this.app,
        getDescriptionText: () => title,
        getSuggestions: (query) =>
          suggestions.filter(({ text }) =>
            text.toLowerCase().includes(query.trim().toLowerCase()),
          ),
        onChooseSuggestion: ({ block }) => resolve(block),
        onClose: () => resolve(undefined),
      }).open();
    });
  }
}
