import { createId } from "../../../redux/index/index-slice";
import { isTaskCache } from "../../../util/metadata";
import { getDayKeysInRange, strictParse } from "../../../util/moment";
import type { ListPropsParser } from "../../list-props-parser";
import type {
  ListItemIndexExtensionService,
  RawListItemEntryWithContext,
} from "../list-item-index-extension-service";

export class TimeEntriesExtensionService
  implements ListItemIndexExtensionService
{
  constructor(private readonly listPropsParser: ListPropsParser) {}

  forFile() {
    return ({
      listItemCache,
      rawListItemEntry,
      listItemText,
    }: RawListItemEntryWithContext) => {
      if (!isTaskCache(listItemCache)) {
        return {};
      }

      const listItemProps = this.listPropsParser.getListPropsFromListItem(
        listItemCache,
        listItemText,
      );

      // todo: cut out props here, use removeWithin(text: string, outer: Pos, inner: Pos)

      return {
        propsPosition: listItemProps?.position,
        logEntries:
          listItemProps?.parsed.planner?.log?.map(({ start, end }, index) =>
            this.createLogEntry({
              start,
              end,
              parent: rawListItemEntry.id,
              id: createId(rawListItemEntry.id, index),
            }),
          ) ?? [],
      };
    };
  }

  private createLogEntry(props: {
    start: string;
    end?: string;
    parent: string;
    id: string;
  }) {
    const { start, end, parent, id } = props;

    const parsedStart = strictParse(start);

    const parsedEnd = end
      ? strictParse(end)
      : // TODO: P3 bug
        //  Solution 1: dispatch dayChanged() and update active clocks then; simple & works
        //  Solution 2: calculate dayKeys for active clocks on the fly in selectActiveLogEntries selector
        //  Solution 3: use sorted array instead of buckets
        window.moment();

    const dayKeys: string[] = getDayKeysInRange(parsedStart, parsedEnd);

    return { start, end, parent, dayKeys, id };
  }
}
