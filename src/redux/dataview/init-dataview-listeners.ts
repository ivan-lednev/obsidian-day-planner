import type { MetadataCache, Vault } from "obsidian";

import { getPropertiesFromListItems } from "../../util/list-metadata";
import type { AppListenerEffect } from "../store";

import { type DataviewChangeAction, listPropsParsed } from "./dataview-slice";

export function createListPropsParseListener(props: {
  vault: Vault;
  metadataCache: MetadataCache;
}): AppListenerEffect<DataviewChangeAction> {
  const { vault, metadataCache } = props;

  async function getListItemProperties(path: string) {
    const file = vault.getFileByPath(path);

    if (!file) {
      return;
    }

    const metadata = metadataCache.getFileCache(file);

    if (!metadata?.listItems) {
      return;
    }

    const contents = await vault.cachedRead(file);

    return getPropertiesFromListItems(contents, metadata);
  }

  return async (action, listenerApi) => {
    const path = action.payload;

    const listProps = await getListItemProperties(path);

    listenerApi.dispatch(listPropsParsed({ path, lineToListProps: listProps }));
  };
}
