import type { Moment } from "moment/moment";
import {
  FileView,
  MarkdownView,
  TFile,
  Workspace,
  WorkspaceLeaf,
  type Pos,
} from "obsidian";
import { isInstanceOf, isNotVoid } from "typed-assert";

import type { PeriodicNotes } from "./periodic-notes";
import type { VaultFacade } from "./vault-facade";

function doesLeafContainFile(leaf: WorkspaceLeaf, file: TFile) {
  const { view } = leaf;

  return view instanceof FileView && view.file === file;
}

export class WorkspaceFacade {
  constructor(
    private readonly workspace: Workspace,
    private readonly vaultFacade: VaultFacade,
    private readonly periodicNotes: PeriodicNotes,
  ) {}

  onLayoutChange(handler: () => void) {
    return this.workspace.on("layout-change", handler);
  }

  onActiveLeafChange(handler: (leaf: WorkspaceLeaf | null) => void) {
    return this.workspace.on("active-leaf-change", handler);
  }

  isLeafInSidebar(leaf: WorkspaceLeaf) {
    const root = leaf.getRoot();

    // Note: leaves in pop-out windows have their own root, and Obsidian shows
    // the native header there, same as in the main area
    return (
      root === this.workspace.leftSplit || root === this.workspace.rightSplit
    );
  }

  async openFileInEditor(file: TFile) {
    const leafWithThisFile = this.workspace
      .getLeavesOfType("markdown")
      .find((leaf) => doesLeafContainFile(leaf, file));

    if (leafWithThisFile) {
      this.workspace.setActiveLeaf(leafWithThisFile, { focus: true });

      if (leafWithThisFile.view instanceof MarkdownView) {
        return leafWithThisFile.view.editor;
      }
    } else {
      const newLeaf = this.workspace.getLeaf(false);

      await newLeaf.openFile(file);

      if (newLeaf.view instanceof MarkdownView) {
        return newLeaf.view.editor;
      }
    }
  }

  getLastCaretLocation = () => {
    const view = this.getActiveMarkdownView();

    const file = view.file;

    isNotVoid(file, "There is no file in view");

    const path = file.path;
    const line = view.editor.getCursor().line;

    return { path, line };
  };

  async openFileForDay(moment: Moment) {
    const dailyNote =
      this.periodicNotes.getDailyNote(
        moment,
        this.periodicNotes.getAllDailyNotes(),
      ) || (await this.periodicNotes.createDailyNote(moment));

    return this.openFileInEditor(dailyNote);
  }

  getActiveMarkdownView = () => {
    const view = this.workspace.getMostRecentLeaf()?.view;

    isInstanceOf(view, MarkdownView, "No markdown editor is active");

    return view;
  };

  async revealLocation({ path, position }: { path: string; position?: Pos }) {
    const file = this.vaultFacade.getFileByPath(path);

    const editor = await this.openFileInEditor(file);

    if (!editor || !position) {
      return;
    }

    const line = position.start.line;

    this.workspace
      .getActiveViewOfType(MarkdownView)
      ?.setEphemeralState({ line });

    editor.setCursor({ line, ch: editor.getLine(line).length });
  }
}
