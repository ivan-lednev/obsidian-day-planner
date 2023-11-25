import Day from "../day";
import { PlannedItem, PlannedItemLoader } from "../planned-items";

export default class NullLoader implements PlannedItemLoader<PlannedItem> {
  public async forDays(days: Set<Day>): Promise<Map<Day, Array<PlannedItem>>> {
    return new Map();
  }
}
