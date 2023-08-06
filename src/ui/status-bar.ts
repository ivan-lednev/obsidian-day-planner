import type { Workspace } from "obsidian";
import type DayPlannerFile from "../file";
import type { PlanSummaryData } from "../plan/plan-summary-data";
import type PlannerMarkdown from "../planner-markdown";
import type Progress from "../progress";
import type { DayPlannerSettings } from "../settings";
import type { PlanItem } from "../plan/plan-item";

export default class StatusBar {
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
    private readonly progress: Progress,
    private readonly plannerMD: PlannerMarkdown,
    private readonly file: DayPlannerFile,
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

  private setupStatusBarEvents() {
    this.containerEl.onClickEvent(async () => {
      const fileName = this.file.getTodayPlannerFilePath();
      await this.workspace.openLinkText(fileName, "", false);
    });

    this.containerEl.on("mouseenter", ".day-planner", () => {
      this.card.show();
    });

    this.containerEl.on("mouseleave", ".day-planner", () => {
      this.card.hide();
    });
  }

  async refreshStatusBar(planSummary: PlanSummaryData) {
    if (!planSummary.empty && !planSummary.invalid) {
      this.updateProgress(planSummary.current, planSummary.next);
      this.containerEl.show();
    } else {
      this.containerEl.hide();
    }
  }

  hideProgress() {
    this.statusBarProgress.hide();
    this.circle.hide();
    this.nextText.hide();
  }

  private updateProgress(current: PlanItem, next: PlanItem) {
    if (!current || !next || current.isEnd) {
      this.hideProgress();
      this.statusBarText.innerText = this.settings.endLabel;
      return;
    }
    const { percentageComplete, minsUntilNext } = this.progress.getProgress(
      current,
      next,
    );
    if (this.settings.circularProgress) {
      this.statusBarProgress.hide();
      this.progressCircle(percentageComplete);
    } else {
      this.circle.hide();
      this.progressBar(percentageComplete);
    }
    this.statusText(minsUntilNext, current, next, percentageComplete);
  }

  private progressBar(percentageComplete: number) {
    this.statusBarCurrentProgress.style.width = `${percentageComplete}%`;
    this.statusBarProgress.show();
  }

  private progressCircle(percentageComplete: number) {
    this.circle.setAttr("data-value", percentageComplete.toFixed(0));
    this.circle.show();
  }

  private statusText(
    minsUntilNext: string,
    current: PlanItem,
    next: PlanItem,
    percentageComplete: number,
  ) {
    minsUntilNext = minsUntilNext === "0" ? "1" : minsUntilNext;
    const minsText = `${minsUntilNext} min${minsUntilNext === "1" ? "" : "s"}`;
    if (this.settings.nowAndNextInStatusBar) {
      this.statusBarText.innerHTML = `<strong>Now</strong> ${
        current.rawStartTime
      } ${this.ellipsis(current.text, 10)}`;
      this.nextText.innerHTML = `<strong>Next</strong> ${
        next.rawStartTime
      } ${this.ellipsis(next.text, 10)}`;
      this.nextText.show();
    } else {
      this.nextText.hide();
      this.statusBarText.innerText = `${minsText} left`;
    }
    const currentTaskStatus = `Current Task (${percentageComplete.toFixed(
      0,
    )}% complete)`;
    const currentTaskTimeAndText = `${current.rawStartTime} ${current.text}`;
    const nextTask = `Next Task (in ${minsText})`;
    const nextTaskTimeAndText = `${next.rawStartTime} ${next.text}`;
    this.cardCurrent.innerHTML = `<strong>${currentTaskStatus}</strong><br> ${currentTaskTimeAndText}`;
    this.cardNext.innerHTML = `<strong>${nextTask}</strong><br> ${nextTaskTimeAndText}`;
    this.taskNotification(
      current,
      currentTaskTimeAndText,
      nextTask,
      nextTaskTimeAndText,
    );
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
