import type { DayPlannerSettings } from "../settings";
import type { PlanItem } from "../types";
import { ellipsis } from "../util/ellipsis";
import { getDiffInMinutes } from "../util/moment";
import { getEndTime } from "../util/task-utils";

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
    private readonly settings: () => DayPlannerSettings,
    private readonly containerEl: HTMLElement,
    private readonly onClick: () => Promise<void>,
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
      await this.onClick();
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
      (item) => item.startTime.isBefore(now) && getEndTime(item).isAfter(now),
    );

    if (currentItemIndex < 0) {
      this.hideProgress();
      this.statusBarText.innerText = this.settings().endLabel;
      return;
    }

    console.log({ planItems });
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

    if (this.settings().circularProgress) {
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
    const minutesLeft = getDiffInMinutes(
      getEndTime(currentItem),
      window.moment(),
    );
    const timeLeft = window.moment
      .utc(window.moment.duration(minutesLeft, "minutes").asMilliseconds())
      .format("HH:mm");

    this.statusBarText.textContent = `-${timeLeft}`;

    this.nextText.hide();
    const trimmedNow = ellipsis(currentItem.firstLineText, 15);
    const trimmedNext = nextItem ? ellipsis(nextItem.firstLineText, 15) : "";
    this.statusBarText.textContent =
      `▶ ${trimmedNow} (-${timeLeft})` +
      (trimmedNext.length > 0 ? " ▶▶ " + trimmedNext : "");
  }

  private taskNotification(
    current: PlanItem,
    currentTaskTimeAndText: string,
    nextTask: string,
    nextTaskText: string,
  ) {
    if (
      this.settings().showTaskNotification &&
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
