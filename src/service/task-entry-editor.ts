import { isNotVoid } from "typed-assert";

import type { AppStore } from "../redux/store";
import { selectListPropsPosition } from "../redux/tracker/tracker-slice";
import { locToEditorPosition } from "../util/editor";
import {
  addOpenClock,
  cancelOpenClock,
  clockOut,
  createPropsWithOpenClock,
  type Props,
  toIndentedMarkdown,
} from "../util/props";
import { withNotice } from "../util/with-notice";

import type { ListPropsParser } from "./list-props-parser";
import { MetadataCacheFacade } from "./metadata-cache-facade";
import type { VaultFacade } from "./vault-facade";
import { WorkspaceFacade } from "./workspace-facade";

export class TaskEntryEditor {
  editProps = withNotice(
    async (props: {
      path: string;
      line: number;
      editFn: (props: Props) => Props;
    }) => {
      const { path, line, editFn } = props;
      const listItem = this.metadataCacheFacade.getListItem(path, line);

      const listPropsForLine = await this.findListProps(path, line);

      isNotVoid(listItem, `No task found: ${path}:${line}`);
      isNotVoid(listPropsForLine, `No list props found: ${path}:${line}`);

      const updatedProps = editFn(listPropsForLine.parsed);
      const indented = toIndentedMarkdown(
        updatedProps,
        listItem.position.start.col,
      );

      await this.vaultFacade.editFile(
        path,
        (contents) =>
          contents.slice(0, listPropsForLine.position.start.offset) +
          indented +
          contents.slice(listPropsForLine.position.end.offset),
      );
    },
  );

  clockInUnderCursor = withNotice(async () => {
    await this.updateListPropsUnderCursor((props) =>
      props ? addOpenClock(props) : createPropsWithOpenClock(),
    );
  });

  clockOutUnderCursor = withNotice(async () => {
    await this.updateListPropsUnderCursor((props) => {
      if (!props) {
        throw new Error("There are no props under cursor");
      }

      return clockOut(props);
    });
  });

  cancelClockUnderCursor = withNotice(async () => {
    await this.updateListPropsUnderCursor((props) => {
      if (!props) {
        throw new Error("There are no props under cursor");
      }

      return cancelOpenClock(props);
    });
  });

  constructor(
    private readonly getState: AppStore["getState"],
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly metadataCacheFacade: MetadataCacheFacade,
    private readonly listPropsParser: ListPropsParser,
  ) {}

  getListItemCacheUnderCursorFromLastView = () => {
    const location = this.workspaceFacade.getLastCaretLocation();
    const { path, line } = location;
    const listItemCache = this.metadataCacheFacade.getListItem(path, line);

    isNotVoid(listItemCache, "No task under cursor");

    return { listItemCache, location };
  };

  private async findListProps(path: string, line: number) {
    const position = selectListPropsPosition(this.getState(), path, line);

    if (!position) {
      return undefined;
    }

    const lineToListProps = await this.listPropsParser.parse(path);

    const listPropsForLine = lineToListProps?.[line];

    isNotVoid(
      listPropsForLine,
      `Expected to find list props at ${path}:${line}`,
    );

    return listPropsForLine;
  }

  private async updateListPropsUnderCursor(updateFn: (props?: Props) => Props) {
    const {
      listItemCache,
      location: { path, line },
    } = this.getListItemCacheUnderCursorFromLastView();

    const foundListPropsForLine = await this.findListProps(path, line);

    const updatedProps = updateFn(foundListPropsForLine?.parsed);
    const indented = toIndentedMarkdown(
      updatedProps,
      listItemCache.position.start.col,
    );

    let result = indented + "\n";

    const view = this.workspaceFacade.getActiveMarkdownView();

    if (foundListPropsForLine) {
      view.editor.replaceRange(
        indented,
        locToEditorPosition(foundListPropsForLine.position.start),
        locToEditorPosition(foundListPropsForLine.position.end),
      );
    } else {
      const afterFirstLine = {
        // todo: replace all '+ 1' with editor-util
        line: listItemCache.position.start.line + 1,
        ch: 0,
      };

      const needsNewlineBeforeProps =
        listItemCache.position.start.line === view.editor.lastLine();

      if (needsNewlineBeforeProps) {
        result = "\n" + result;
      }

      view.editor.replaceRange(result, afterFirstLine, afterFirstLine);
    }
  }
}
