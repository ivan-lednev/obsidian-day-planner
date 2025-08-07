import { isNotVoid } from "typed-assert";

import {
  selectListPropsForLocation,
  selectListPropsForPath,
} from "../redux/dataview/dataview-slice";
import type { AppStore } from "../redux/store";
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

import { DataviewFacade } from "./dataview-facade";
import type { VaultFacade } from "./vault-facade";
import { WorkspaceFacade } from "./workspace-facade";

// export interface Writer {
//   update(operation: Updated): Promise<void>;
// }
//
// export class VaultWriter implements Writer {
//   constructor(private readonly vaultFacade: VaultFacade) {}
//
//   async update(operation: Updated) {
//     const {
//       range: { start, end },
//       contents: updateContents,
//     } = operation;
//
//     await this.vaultFacade.editFile(
//       operation.path,
//       (contents) =>
//         contents.slice(0, start.offset) +
//         updateContents +
//         contents.slice(end.offset),
//     );
//   }
// }

// export class ActiveViewAwareWriter implements Writer {
//   constructor(
//     private readonly fallback: Writer,
//     private readonly workspaceFacade: WorkspaceFacade,
//   ) {}
//
//   async update(operation: Updated) {
//     const view = this.workspaceFacade.getActiveMarkdownView();
//
//     if (!view || view.file?.path === operation.path) {
//       await this.fallback.update(operation);
//     }
//
//     const {
//       range: { start, end },
//       contents: updateContents,
//     } = operation;
//
//     view.editor.replaceRange(
//       updateContents,
//       locToEditorPosition(start),
//       locToEditorPosition(end),
//     );
//   }
// }

export class STaskEditor {
  // todo: make private
  // todo: remove withNotice
  editProps = withNotice(
    async (props: {
      path: string;
      line: number;
      editFn: (props: Props) => Props;
    }) => {
      const { path, line, editFn } = props;
      const sTask = this.dataviewFacade.getTaskAtLine({ path, line });
      const listPropsForLine = this.getListProps({ path, line });

      isNotVoid(sTask, `No task found: ${path}:${line}`);
      isNotVoid(listPropsForLine, `No list props found: ${path}:${line}`);

      const updatedProps = editFn(listPropsForLine.listPropsForLine);
      const indented = toIndentedMarkdown(
        updatedProps,
        sTask.position.start.col,
      );

      await this.vaultFacade.editFile(
        sTask.path,
        (contents) =>
          contents.slice(0, listPropsForLine.position.start.offset) +
          indented +
          contents.slice(listPropsForLine.position.end.offset),
      );
    },
  );

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
    const props = selectListPropsForLocation(
      this.getState(),
      location.path,
      location.line,
    );

    if (!props) {
      return undefined;
    }

    return {
      listPropsForLine: props.parsed,
      position: props.position,
    };
  }

  getSTaskWithListPropsUnderCursor() {
    const { sTask, location } = this.getSTaskUnderCursorFromLastView();
    const listProps = this.getListProps(location);

    if (!listProps) {
      return sTask;
    }

    return {
      ...sTask,
      props: {
        validated: { ...listProps.listPropsForLine },
        position: listProps.position,
      },
    };
  }

  // todo: receive editor
  private updateListPropsUnderCursor(updateFn: (props?: Props) => Props) {
    const sTask = this.getSTaskWithListPropsUnderCursor();

    const updatedProps = updateFn(sTask.props?.validated);
    const indented = toIndentedMarkdown(updatedProps, sTask.position.start.col);

    const withNewline = indented + "\n";

    // todo: remove
    const view = this.workspaceFacade.getActiveMarkdownView();

    if (sTask.props?.validated) {
      view.editor.replaceRange(
        indented,
        locToEditorPosition(sTask.props.position.start),
        locToEditorPosition(sTask.props.position.end),
      );
    } else {
      const afterFirstLine = {
        line: sTask.position.start.line + 1,
        ch: 0,
      };

      view.editor.replaceRange(withNewline, afterFirstLine, afterFirstLine);
    }
  }
}
