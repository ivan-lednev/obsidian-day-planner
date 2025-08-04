import { isNotVoid } from "typed-assert";

import { selectListPropsForPath } from "../redux/dataview/dataview-slice";
import type { AppStore } from "../redux/store";
import { locToEditorPosition } from "../util/editor";
import {
  addOpenClock,
  cancelOpenClock,
  clockOut,
  createPropsWithOpenClock,
  type Props,
  propsSchema,
  toIndentedMarkdown,
} from "../util/props";
import { withNotice } from "../util/with-notice";

import { DataviewFacade } from "./dataview-facade";
import type { VaultFacade } from "./vault-facade";
import { WorkspaceFacade } from "./workspace-facade";

export class STaskEditor {
  editProps = withNotice(
    async (props: {
      path: string;
      line: number;
      editFn: (props: Props) => Props;
    }) => {
      const { path, line, editFn } = props;
      const sTask = this.dataviewFacade.getTaskAtLine({ path, line });
      const { listPropsForLine, position } = this.getListProps({ path, line });

      isNotVoid(sTask, `No task found: ${path}:${line}`);
      isNotVoid(listPropsForLine, `No list props found: ${path}:${line}`);

      const updatedProps = editFn(listPropsForLine);
      const indented = toIndentedMarkdown(
        updatedProps,
        sTask.position.start.col,
      );

      await this.vaultFacade.editFile(
        sTask.path,
        (contents) =>
          contents.slice(0, position.start.offset) +
          indented +
          contents.slice(position.end.offset),
      );
    },
  );

  constructor(
    private readonly getState: AppStore["getState"],
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly dataviewFacade: DataviewFacade,
  ) {}

  getSTaskUnderCursorFromLastView = () => {
    const location = this.workspaceFacade.getLastCaretLocation();
    const { path, line } = location;
    const sTask = this.dataviewFacade.getTaskAtLine({ path, line });

    isNotVoid(sTask, "No task under cursor");

    return { sTask, location };
  };

  private getListProps(location: { path: string; line: number }) {
    const listPropsForPath = selectListPropsForPath(
      this.getState(),
      location.path,
    );

    const listPropsForLine = listPropsForPath?.[location.line];
    const validated = this.validate(listPropsForLine?.parsed);

    return {
      listPropsForLine: validated,
      position: listPropsForLine.position,
    };
  }

  getSTaskWithListPropsUnderCursor() {
    const { sTask, location } = this.getSTaskUnderCursorFromLastView();
    const { listPropsForLine, position } = this.getListProps(location);

    return {
      sTask,
      listPropsForLine,
      position,
    };
  }

  // todo: remove
  private validate(yaml?: Record<string, unknown>) {
    if (!yaml) {
      return;
    }

    const { data, error } = propsSchema.safeParse(yaml);

    if (error) {
      throw new Error(`Invalid props under cursor: ${error.message}`);
    }

    return data;
  }

  private updateListPropsUnderCursor(updateFn: (props?: Props) => Props) {
    const { sTask, listPropsForLine, position } =
      this.getSTaskWithListPropsUnderCursor();
    const updatedProps = updateFn(listPropsForLine);
    const indented = toIndentedMarkdown(updatedProps, sTask.position.start.col);
    const withNewline = indented + "\n";

    const view = this.workspaceFacade.getActiveMarkdownView();

    if (listPropsForLine) {
      view.editor.replaceRange(
        indented,
        locToEditorPosition(position.start),
        locToEditorPosition(position.end),
      );
    } else {
      const afterFirstLine = {
        line: sTask.position.start.line + 1,
        ch: 0,
      };

      view.editor.replaceRange(withNewline, afterFirstLine, afterFirstLine);
    }
  }

  clockInUnderCursor = withNotice(() => {
    this.updateListPropsUnderCursor((props) =>
      props ? addOpenClock(props) : createPropsWithOpenClock(),
    );
  });

  clockOutUnderCursor = withNotice(() => {
    this.updateListPropsUnderCursor((props) => {
      if (!props) {
        throw new Error("There are no props under cursor");
      }

      return clockOut(props);
    });
  });

  cancelClockUnderCursor = withNotice(() => {
    this.updateListPropsUnderCursor((props) => {
      if (!props) {
        throw new Error("There are no props under cursor");
      }

      return cancelOpenClock(props);
    });
  });
}
