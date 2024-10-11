import { flow } from "lodash/fp";
import { STask } from "obsidian-dataview";
import { isNotVoid } from "typed-assert";

import {
  assertActiveClock,
  assertNoActiveClock,
  withActiveClock,
  withActiveClockCompleted,
  withoutActiveClock,
} from "../util/clock";
import { replaceSTaskInFile, toMarkdown } from "../util/dataview";
import { locToEditorPosition } from "../util/editor";
import { withNotice } from "../util/with-notice";

import { DataviewFacade } from "./dataview-facade";
import type { VaultFacade } from "./vault-facade";
import { WorkspaceFacade } from "./workspace-facade";

export class STaskEditor {
  clockOut = withNotice(async (sTask: STask) => {
    await this.vaultFacade.editFile(sTask.path, (contents) =>
      replaceSTaskInFile(
        contents,
        sTask,
        toMarkdown(withActiveClockCompleted(sTask)),
      ),
    );
  });
  cancelClock = withNotice(async (sTask: STask) => {
    await this.vaultFacade.editFile(sTask.path, (contents) =>
      replaceSTaskInFile(
        contents,
        sTask,
        toMarkdown(withoutActiveClock(sTask)),
      ),
    );
  });

  constructor(
    private readonly workspaceFacade: WorkspaceFacade,
    private readonly vaultFacade: VaultFacade,
    private readonly dataviewFacade: DataviewFacade,
  ) {}

  private replaceSTaskUnderCursor = (newMarkdown: string) => {
    const view = this.workspaceFacade.getActiveMarkdownView();
    const sTask = this.getSTaskUnderCursorFromLastView();

    view.editor.replaceRange(
      newMarkdown,
      locToEditorPosition(sTask.position.start),
      locToEditorPosition(sTask.position.end),
    );
  };

  private getSTaskUnderCursorFromLastView = () => {
    const sTask = this.dataviewFacade.getTaskFromCaretLocation(
      this.workspaceFacade.getLastCaretLocation(),
    );

    isNotVoid(sTask, "No task under cursor");

    return sTask;
  };

  clockInUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertNoActiveClock,
      withActiveClock,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );

  clockOutUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertActiveClock,
      withActiveClockCompleted,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );

  cancelClockUnderCursor = withNotice(
    flow(
      this.getSTaskUnderCursorFromLastView,
      assertActiveClock,
      withoutActiveClock,
      toMarkdown,
      this.replaceSTaskUnderCursor,
    ),
  );
}
