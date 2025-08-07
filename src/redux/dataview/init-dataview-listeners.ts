import type { ListPropsParser } from "../../service/list-props-parser";
import type { AppListenerEffect } from "../store";

import { type DataviewChangeAction, listPropsParsed } from "./dataview-slice";

export function createListPropsParseListener(props: {
  listPropsParser: ListPropsParser;
}): AppListenerEffect<DataviewChangeAction> {
  const { listPropsParser } = props;

  return async (action, listenerApi) => {
    const path = action.payload;

    const listProps = await listPropsParser.parse(path);

    listenerApi.dispatch(listPropsParsed({ path, lineToListProps: listProps }));
  };
}
