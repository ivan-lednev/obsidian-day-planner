import type { MetadataCache, Vault } from "obsidian";

import { getListPropsForPath } from "../../util/list-metadata";
import type { AppListenerEffect } from "../store";

import { type DataviewChangeAction, listPropsParsed } from "./dataview-slice";

export function createListPropsParseListener(props: {
  vault: Vault;
  metadataCache: MetadataCache;
}): AppListenerEffect<DataviewChangeAction> {
  return async (action, listenerApi) => {
    const path = action.payload;

    const listProps = await getListPropsForPath(path, {
      vault: props.vault,
      metadataCache: props.metadataCache,
    });

    listenerApi.dispatch(listPropsParsed({ path, lineToListProps: listProps }));
  };
}
