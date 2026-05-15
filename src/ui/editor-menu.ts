import type {
  Editor,
  MarkdownFileInfo,
  MarkdownView,
  Menu,
  MetadataCache,
} from "obsidian";

import type { ListItemEntryEditor } from "../service/list-item-entry-editor";
import type { ListPropsParser } from "../service/list-props-parser";
import type { MetadataCacheFacade } from "../service/metadata-cache-facade";
import { isTaskCache } from "../util/metadata";
import { isWithOpenClock } from "../util/props";

export const createEditorMenuCallback =
  (props: {
    taskEntryEditor: ListItemEntryEditor;
    metadataCacheFacade: MetadataCacheFacade;
    listPropsParser: ListPropsParser;
    metadataCache: MetadataCache;
  }) =>
  async (menu: Menu, editor: Editor, info: MarkdownView | MarkdownFileInfo) => {
    const {
      taskEntryEditor,
      metadataCacheFacade,
      metadataCache,
      listPropsParser,
    } = props;

    const path = info.file?.path;

    if (!path) {
      return;
    }

    const line = editor.getCursor().line;
    const fileCache = metadataCache.getCache(path);
    const listItemCache = metadataCacheFacade.getListItem(path, line);

    if (!fileCache || !listItemCache || !isTaskCache(listItemCache)) {
      return;
    }

    const contents = editor.getValue();
    const propsForFile = listPropsParser.getListPropsFromFile(
      contents,
      fileCache,
    );

    const propsForLine = propsForFile?.[line];

    menu.addSeparator();

    if (isWithOpenClock(propsForLine?.parsed)) {
      menu.addItem((item) => {
        item
          .setTitle("Clock out")
          .setIcon("square")
          .onClick(() => taskEntryEditor.clockOutUnderCursor());
      });

      menu.addItem((item) => {
        item
          .setTitle("Cancel clock")
          .setIcon("trash")
          .onClick(() => taskEntryEditor.cancelClockUnderCursor());
      });
    } else {
      menu.addItem((item) => {
        item
          .setTitle("Clock in")
          .setIcon("play")
          .onClick(() => taskEntryEditor.clockInUnderCursor());
      });
    }
  };
