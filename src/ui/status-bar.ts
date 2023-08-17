import type { Workspace } from "obsidian";
import type { DayPlannerSettings } from "../settings";
import { getDiffInMinutes } from "../util/moment";
import type { PlanItem } from "../types";

export class StatusBar {
  private statusBarText: HTMLSpanElement;
  private nextText: HTMLSpanElement;
  private statusBarProgress: HTMLDivElement;
  private statusBarCurrentProgress: HTMLDivElement;
  private circle: HTMLDivElement;
  private card: HTMLDivElement;
  private cardCurrent: HTMLSpanElement;
  private cardNext: HTMLSpanElement;
  private currentTime: string;

  constructor(
    private readonly settings: DayPlannerSettings,
    private readonly containerEl: HTMLElement,
    private readonly workspace: Workspace,
  ) {
    // todo: this is redundant
    this.containerEl.addClass("day-planner");

    this.setupCard();
    this.statusBarText = this.containerEl.createEl("span", {
      cls: ["status-bar-item-segment", "day-planner-status-bar-text"],
    });

    this.setupCircularProgressBar();
    this.setupHorizontalProgressBar();

    this.nextText = this.containerEl.createEl("span", {
      cls: ["status-bar-item-segment", "day-planner-status-bar-text"],
    });

    this.setupStatusBarEvents();
  }

  async update(planItems: PlanItem[]) {
    this.containerEl.show();
    if (planItems.length > 0) {
      this.updateProgress(planItems);
    } else {
      this.setEmpty();
    }
  }

  setEmpty() {
    this.setText("No plan for today");
  }

  setText(text: string) {
    this.statusBarText.textContent = text;
  }

  private setupStatusBarEvents() {
    this.containerEl.onClickEvent(async () => {
      // todo: open daily note
    });

    this.containerEl.on("mouseenter", ".day-planner", () => {
      this.card.show();
    });

    this.containerEl.on("mouseleave", ".day-planner", () => {
      this.card.hide();
    });
  }

  private hideProgress() {
    this.statusBarProgress.hide();
    this.circle.hide();
    this.nextText.hide();
  }

  private updateProgress(planItems: PlanItem[]) {
    const now = window.moment();

    const currentItemIndex = planItems.findIndex(
      (item) => item.startTime.isBefore(now) && item.endTime.isAfter(now),
    );

    if (currentItemIndex < 0) {
      this.hideProgress();
      this.statusBarText.innerText = this.settings.endLabel;
      return;
    }

    // todo: move calculations out
    const currentItem = planItems[currentItemIndex];
    const nextItem = planItems[currentItemIndex + 1];

    const minutesFromStart = getDiffInMinutes(currentItem.startTime, now);
    const percentageComplete =
      minutesFromStart / (currentItem.durationMinutes / 100);

    this.updateStatusBarText(currentItem, nextItem);

    if (nextItem) {
      this.setStatusText(
        getDiffInMinutes(now, nextItem.startTime),
        currentItem,
        nextItem,
        percentageComplete,
      );
    }

    if (this.settings.circularProgress) {
      this.statusBarProgress.hide();
      this.progressCircle(percentageComplete);
    } else {
      this.circle.hide();
      this.progressBar(percentageComplete);
    }
  }

  private progressBar(percentageComplete: number) {
    this.statusBarCurrentProgress.style.width = `${percentageComplete}%`;
    this.statusBarProgress.show();
  }

  private progressCircle(percentageComplete: number) {
    this.circle.setAttr("data-value", percentageComplete.toFixed(0));
    this.circle.show();
  }

  private setStatusText(
    minsUntilNext: number,
    current: PlanItem,
    next: PlanItem,
    percentageComplete: number,
  ) {
    const minsUntilNextText = minsUntilNext === 0 ? "1" : minsUntilNext;
    const minsText = `${minsUntilNextText} min${
      minsUntilNextText === "1" ? "" : "s"
    }`;

    const percent = percentageComplete.toFixed(0);
    const currentTaskStatus = `Current Task (${percent}% complete)`;

    // todo: this is out of place
    const currentTaskTimeAndText = `${current.rawStartTime} ${current.text}`;
    const nextTask = `Next Task (in ${minsText})`;
    const nextTaskTimeAndText = `${next.rawStartTime} ${next.text}`;

    this.cardCurrent.textContent = `${currentTaskStatus}: ${currentTaskTimeAndText}`;
    this.cardNext.textContent = `${nextTask}: ${nextTaskTimeAndText}`;

    // todo: this is out of place
    this.taskNotification(
      current,
      currentTaskTimeAndText,
      nextTask,
      nextTaskTimeAndText,
    );
  }

  private updateStatusBarText(currentItem: PlanItem, nextItem?: PlanItem) {
    if (this.settings.nowAndNextInStatusBar) {
      this.statusBarText.textContent = `Now: ${
        currentItem.rawStartTime
      } ${this.ellipsis(currentItem.text, 15)}`;

      if (nextItem) {
        this.nextText.textContent = `Next: ${
          nextItem.rawStartTime
        } ${this.ellipsis(nextItem.text, 15)}`;

        this.nextText.show();
      }

      this.nextText.hide();
    } else {
      this.nextText.hide();
      const minutesLeft = getDiffInMinutes(
        currentItem.endTime,
        window.moment(),
      );
      this.statusBarText.textContent = `Minutes left: ${minutesLeft}`;
    }
  }

  private taskNotification(
    current: PlanItem,
    currentTaskTimeAndText: string,
    nextTask: string,
    nextTaskText: string,
  ) {
    if (
      this.settings.showTaskNotification &&
      this.currentTime !== undefined &&
      this.currentTime !== current.startTime.toString()
    ) {
      new Notification(`Task started, ${currentTaskTimeAndText}`, {
        body: `${nextTask}: ${nextTaskText}`,
        requireInteraction: true,
      });
    }
    this.currentTime = current.startTime.toString();
  }

  // todo: this doesn't belong to the class
  private ellipsis(input: string, limit: number) {
    if (input.length <= limit) {
      return input;
    }
    return input.substring(0, limit) + "...";
  }

  private setupHorizontalProgressBar() {
    this.statusBarProgress = this.containerEl.createEl("div", {
      cls: ["status-bar-item-segment", "day-planner-progress-bar"],
    });
    this.statusBarProgress.hide();
    this.statusBarCurrentProgress = this.statusBarProgress.createEl("div", {
      cls: "day-planner-progress-value",
    });
  }

  private setupCircularProgressBar() {
    this.circle = this.containerEl.createEl("div", {
      cls: ["status-bar-item-segment", "progress-pie day-planner"],
    });
  }

  private setupCard() {
    this.card = this.containerEl.createEl("div", {
      cls: "day-planner-status-card",
    });

    this.cardCurrent = this.card.createEl("span");

    this.card.createEl("br");
    this.card.createEl("br");

    this.cardNext = this.card.createEl("span");

    this.card.createEl("div", { cls: "arrow-down" });
  }
}
