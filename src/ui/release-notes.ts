import { ItemView, MarkdownPreviewView } from "obsidian";

import { viewTypeReleaseNotes } from "../constants";

export class DayPlannerReleaseNotesView extends ItemView {
  getViewType() {
    return viewTypeReleaseNotes;
  }

  getDisplayText() {
    return `Day Planner Release ${currentPluginVersion}`;
  }

  async onOpen() {
    this.contentEl.addClass("release-notes-view");

    // This is copied from Obsidian, to preserve similarity with Obsidian's release notes
    const container = this.contentEl
      .createDiv({ cls: "cm-scroller is-readable-line-width" })
      .createDiv({ cls: "markdown-preview-view markdown-rendered" });

    await MarkdownPreviewView.render(
      this.app,
      supportBanner + changelogMd,
      container,
      "/",
      this,
    );
  }
}
