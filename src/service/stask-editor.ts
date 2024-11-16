import { flow } from "lodash/fp";
import type { STask } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

import {
  assertActiveClock,
  assertNoActiveClock,
  withActiveClock,
  withActiveClockCompleted,
  withoutActiveClock,
} from "../util/clock";
import * as dv from "../util/dataview";
import { locToEditorPosition } from "../util/editor";
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
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly dataviewFacade: DataviewFacade,
  ) {}

  private replaceSTaskUnderCursor = (newMarkdown: string) => {
    const view = this.workspaceFacade.getActiveMarkdownView();
    const sTask = this.getSTaskUnderCursorFromLastView();

    // Note: we re-calculate indentation when transforming sTasks to markdown, so we
    //  don't need the original indentation
    const replacementStart = { ...sTask.position.start, col: 0 };

    view.editor.replaceRange(
      newMarkdown,
      locToEditorPosition(replacementStart),
      locToEditorPosition(sTask.position.end),
    );
  };

  private getSTaskUnderCursorFromLastView = () => {
    const sTask = this.dataviewFacade.getTaskAtLine(
      this.workspaceFacade.getLastCaretLocation(),
    );

    isNotVoid(sTask, "No task under cursor");

    return sTask;
  };

  // todo: remove duplication
  clockInUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertNoActiveClock,
      withActiveClock,
      dv.textToMarkdownWithIndentation,
      this.replaceSTaskUnderCursor,
    ),
  );

  clockOutUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertActiveClock,
      withActiveClockCompleted,
      dv.textToMarkdownWithIndentation,
      this.replaceSTaskUnderCursor,
    ),
  );

  cancelClockUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertActiveClock,
      withoutActiveClock,
      dv.textToMarkdownWithIndentation,
      this.replaceSTaskUnderCursor,
    ),
  );
}
