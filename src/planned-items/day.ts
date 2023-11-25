import { Moment } from "moment/moment";

export default class Day {
  private static instances = new Map<string, Day>();

  private constructor(
    public readonly year: number,
    public readonly month: number,
    public readonly day: number,
  ) {}

  public asIso(): string {
    return `${this.year.toString().padStart(4, "0")}-${this.month
      .toString()
      .padStart(2, "0")}-${this.day.toString().padStart(2, "0")}`;
  }

  public equals(other: Day): boolean {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.day === other.day
    );
  }

  public static fromMoment(moment: Moment): Day {
    const key = moment.format("YYYY-MM-DD");
    if (!this.instances.has(key)) {
      this.instances.set(
        key,
        new Day(moment.year(), moment.month() + 1, moment.date()),
      );
    }

    return this.instances.get(key);
  }
}
