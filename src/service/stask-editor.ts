import type { STask } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

import { selectListPropsForPath } from "../redux/dataview/dataview-slice";
import type { AppStore } from "../redux/store";
import * as dv from "../util/dataview";
import { getIndentationForListParagraph } from "../util/dataview";
import { locToEditorPosition } from "../util/editor";
import { createIndentation, indent } from "../util/markdown";
import {
  addOpenClock,
  cancelOpenClock,
  closeActiveClock,
  createPropsWithOpenClock,
  type Props,
  propsSchema,
  toMarkdown,
} from "../util/props";
import { withNotice } from "../util/with-notice";

import { DataviewFacade } from "./dataview-facade";
import type { VaultFacade } from "./vault-facade";
import { WorkspaceFacade } from "./workspace-facade";

export class STaskEditor {
  edit = withNotice(
    async (props: {
      path: string;
      line: number;
      editFn: (sTask: STask) => STask;
    }) => {
      const { path, line, editFn } = props;
      const sTask = this.dataviewFacade.getTaskAtLine({ path, line });

      isNotVoid(sTask, `No task found: ${path}:${line}`);

      const newSTaskMarkdown = dv.textToMarkdownWithIndentation(editFn(sTask));

      await this.vaultFacade.editFile(sTask.path, (contents) =>
        dv.replaceSTaskText(contents, sTask, newSTaskMarkdown),
      );
    },
  );

  constructor(
    private readonly getState: AppStore["getState"],
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly dataviewFacade: DataviewFacade,
  ) {}

  private replaceSTaskUnderCursor = (newMarkdown: string) => {
    const view = this.workspaceFacade.getActiveMarkdownView();
    const { sTask } = this.getSTaskUnderCursorFromLastView();

    // Note: we re-calculate indentation when transforming sTasks to markdown, so we
    //  don't need the original indentation
    const replacementStart = { ...sTask.position.start, col: 0 };

    view.editor.replaceRange(
      newMarkdown,
      locToEditorPosition(replacementStart),
      locToEditorPosition(sTask.position.end),
    );
  };

  getSTaskUnderCursorFromLastView = () => {
    const location = this.workspaceFacade.getLastCaretLocation();
    const { path, line } = location;
    const sTask = this.dataviewFacade.getTaskAtLine({ path, line });

    isNotVoid(sTask, "No task under cursor");

    return { sTask, location };
  };

  getSTaskWithListPropsUnderCursor() {
    const { sTask, location } = this.getSTaskUnderCursorFromLastView();

    const listPropsForPath = selectListPropsForPath(
      this.getState(),
      location.path,
    );

    const listPropsForLine = listPropsForPath?.[location.line];
    const validated = this.validate(listPropsForLine?.parsed);

    return {
      sTask,
      listPropsForLine: validated,
      position: listPropsForLine.position,
    };
  }

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
    const updated = updateFn(listPropsForLine);
    const asMarkdown = toMarkdown(updated);
    // todo: remove duplication
    const indentation =
      createIndentation(sTask.position.start.col) +
      getIndentationForListParagraph(sTask);
    const indented = indent(asMarkdown, indentation);
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

      return closeActiveClock(props);
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
