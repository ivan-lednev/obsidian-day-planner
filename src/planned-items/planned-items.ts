import { SListEntry, STask } from "obsidian-dataview";
import { Readable, readable } from "svelte/store";

import { debounceWithDelay } from "../util/debounce-with-delay";

import Day from "./day";

export type PlannedItem = STask | SListEntry;

export interface PlannedItemLoader<T> {
  forDays(days: Set<Day>): Promise<Map<Day, Array<T>>>;
}

export class PlannedItems<T> {
  private queue = new Set<Day>();
  private active = new Set<Day>();
  private lastRefresh = new Date();
  private cacheDate = new Map<Day, Date>();
  private cacheUpdate = new Map<Day, (value: Array<T>) => void>();
  private cache = new Map<Day, Readable<Array<T>>>();
  private loadQueueDebounced: () => void;
  public delayRefresh: () => void;

  constructor(
    private plannedItems: PlannedItemLoader<T>,
    loadingDelayInMs: number,
  ) {
    [this.loadQueueDebounced, this.delayRefresh] = debounceWithDelay(
      () => this.loadQueue(),
      loadingDelayInMs,
    );
  }

  public refresh(): void {
    this.lastRefresh = new Date();

    this.active.forEach((day) => this.addDayToLoadingQueue(day));
  }

  public forDay(day: Day): Readable<Array<T>> {
    if (!this.cache.has(day)) {
      this.cache.set(day, this.storeForDay(day));
    }

    return this.cache.get(day);
  }

  private addToQueueIfNotYetLoadedOrStale(day: Day): void {
    const cacheDate = this.cacheDate.get(day);

    if (cacheDate === undefined || cacheDate < this.lastRefresh) {
      this.addDayToLoadingQueue(day);
    }
  }

  private addDayToLoadingQueue(day: Day): void {
    this.queue.add(day);

    this.loadQueueDebounced();
  }

  private loadQueue(): void {
    const queue = new Set(this.queue);
    this.queue.clear();

    queue.forEach((day) => this.cacheDate.set(day, new Date()));

    this.plannedItems.forDays(queue).then((value) =>
      value.forEach((tasks, key) => {
        this.cacheUpdate.get(key)(tasks);
      }),
    );
  }

  private storeForDay(day: Day): Readable<Array<T>> {
    return readable<Array<T>>([], (set) => {
      this.active.add(day);

      this.cacheUpdate.set(day, set);

      this.addToQueueIfNotYetLoadedOrStale(day);

      return () => {
        this.active.delete(day);
      };
    });
  }
}
