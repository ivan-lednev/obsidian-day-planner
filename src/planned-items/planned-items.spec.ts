import moment from "moment";
import { get } from "svelte/store";

import Day from "./day";
import { PlannedItems, PlannedItemLoader } from "./planned-items";

const sleep = (milliseconds: number) =>
  new Promise((r) => setTimeout(r, milliseconds));

class MockLoader implements PlannedItemLoader<string> {
  public readonly calls: Array<Array<Day>> = [];
  private readonly items = new Map<Day, Array<string>>();

  public async forDays(days: Set<Day>): Promise<Map<Day, Array<string>>> {
    this.calls.push(Array.from(days));

    const result = new Map<Day, Array<string>>();

    days.forEach((day) => result.set(day, this.items.get(day)));

    return result;
  }

  public setItems(day: Day, tasks: Array<string>) {
    this.items.set(day, tasks);
  }
}

const loadingDelayInMs = 5;
const longEnoughToTriggerLoading = loadingDelayInMs + 2;

const day1 = Day.fromMoment(moment("2023-10-10"));
const day2 = Day.fromMoment(moment("2023-11-11"));
const day3 = Day.fromMoment(moment("2023-12-12"));

let loader = new MockLoader();
let subject: PlannedItems<string>;

describe("Planned Items", () => {
  beforeEach(() => {
    loader = new MockLoader();
    subject = new PlannedItems(loader, loadingDelayInMs);
  });

  it("should return the queried data", async () => {
    loader.setItems(day1, ["task-1"]);
    loader.setItems(day2, ["task-2", "task-3"]);
    loader.setItems(day3, ["task-4"]);

    subject.forDay(day1).subscribe(jest.fn());
    subject.forDay(day2).subscribe(jest.fn());
    subject.forDay(day3).subscribe(jest.fn());
    await sleep(longEnoughToTriggerLoading);

    expect(get(subject.forDay(day1))).toEqual(["task-1"]);
    expect(get(subject.forDay(day2))).toEqual(["task-2", "task-3"]);
    expect(get(subject.forDay(day3))).toEqual(["task-4"]);
  });

  it("should load subscribed days only", async () => {
    subject.forDay(day1).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);

    expect(loader.calls).toEqual([[day1]]);
  });

  it("should load data in batches", async () => {
    subject.forDay(day1).subscribe(jest.fn);
    subject.forDay(day2).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);
    subject.forDay(day3).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);

    expect(loader.calls).toEqual([[day1, day2], [day3]]);
  });

  it("must not requery data if there was no refresh", async () => {
    subject.forDay(day1).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);
    subject.forDay(day2).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);
    subject.forDay(day1).subscribe(jest.fn);
    subject.forDay(day2).subscribe(jest.fn);
    subject.forDay(day3).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);

    expect(loader.calls).toEqual([[day1], [day2], [day3]]);
  });

  it("should requery data after a refresh", async () => {
    subject.forDay(day1).subscribe(jest.fn);
    subject.forDay(day3).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);
    subject.refresh();
    subject.forDay(day2).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);

    expect(loader.calls).toEqual([
      [day1, day3],
      [day1, day3, day2],
    ]);
  });

  it("must not requery unsubscribed days after a refresh", async () => {
    subject.forDay(day1).subscribe(jest.fn);
    const unsubscribeDay2 = subject.forDay(day2).subscribe(jest.fn);
    const unsubscribeDay3 = subject.forDay(day3).subscribe(jest.fn);
    await sleep(longEnoughToTriggerLoading);
    unsubscribeDay2();
    unsubscribeDay3();
    subject.refresh();
    await sleep(longEnoughToTriggerLoading);

    expect(loader.calls).toEqual([[day1, day2, day3], [day1]]);
  });

  it("should return the requeried data", async () => {
    loader.setItems(day1, ["task-1"]);
    loader.setItems(day2, ["task-2"]);
    loader.setItems(day3, ["task-3"]);

    subject.forDay(day1).subscribe(jest.fn());
    subject.forDay(day2).subscribe(jest.fn());
    subject.forDay(day3).subscribe(jest.fn());
    await sleep(longEnoughToTriggerLoading);
    loader.setItems(day1, ["new-task-1"]);
    loader.setItems(day2, ["new-task-2"]);
    loader.setItems(day3, ["new-task-3"]);
    subject.refresh();
    await sleep(longEnoughToTriggerLoading);

    expect(get(subject.forDay(day1))).toEqual(["new-task-1"]);
    expect(get(subject.forDay(day2))).toEqual(["new-task-2"]);
    expect(get(subject.forDay(day3))).toEqual(["new-task-3"]);
  });
});
