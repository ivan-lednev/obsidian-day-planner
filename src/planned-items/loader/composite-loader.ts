import Day from "../day";
import { PlannedItemLoader } from "../planned-items";

export default class CompositeLoader<T> implements PlannedItemLoader<T> {
  constructor(private taskLoaders: Array<PlannedItemLoader<T>>) {}

  public async forDays(days: Set<Day>): Promise<Map<Day, Array<T>>> {
    const result = new Map();

    for (const day of days) {
      result.set(day, []);
    }

    for (const loader of this.taskLoaders) {
      const loaderResult = await loader.forDays(days);
      loaderResult.forEach((value, key) =>
        result.set(key, result.get(key).concat(value)),
      );
    }

    return result;
  }
}
