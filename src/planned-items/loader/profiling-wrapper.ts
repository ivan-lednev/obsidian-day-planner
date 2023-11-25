import Day from "../day";
import { PlannedItemLoader } from "../planned-items";

export class ProfilingWrapper<T> implements PlannedItemLoader<T> {
  constructor(private taskLoader: PlannedItemLoader<T>) {}

  public async forDays(days: Set<Day>): Promise<Map<Day, Array<T>>> {
    performance.mark("profiling-start");
    const result = await this.taskLoader.forDays(days);
    performance.mark("profiling-stop");

    const measure = performance.measure(
      "profiling-time",
      "profiling-start",
      "profiling-stop",
    );

    const args = Array.from(days.values())
      .map((day) => day.asIso())
      .join(", ");
    console.debug(
      `${
        this.taskLoader.constructor.name
      }.forDays(${args}): ${measure.duration.toFixed(2)} ms`,
    );

    return result;
  }
}
