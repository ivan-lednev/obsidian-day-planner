import { createId } from "../../../redux/index/index-slice";
import { isTaskCache } from "../../../util/metadata";
import type { ListPropsParser } from "../../list-props-parser";
import type {
  ListItemIndexExtensionService,
  RawListItemEntryWithContext,
} from "../list-item-index-extension-service";
import { createLogEntry } from "../log-entry";

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
            createLogEntry({
              start,
              end,
              parent: rawListItemEntry.id,
              id: createId(rawListItemEntry.id, index),
            }),
          ) ?? [],
      };
    };
  }
}
