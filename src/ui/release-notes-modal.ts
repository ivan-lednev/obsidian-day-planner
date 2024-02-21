import { MarkdownRenderer, Modal, Plugin } from "obsidian";

import { supportLink } from "../constants";

export class ReleaseNotesModal extends Modal {
  constructor(private readonly plugin: Plugin) {
    super(plugin.app);
  }

  async onOpen() {
    this.titleEl.setText("Day Planner Release Notes");
    this.containerEl.addClass("day-planner-release-notes-modal");
    this.contentEl.createDiv({ cls: "support" }, async (el) => {
      await MarkdownRenderer.render(
        this.plugin.app,
        supportLink,
        el,
        "/",
        this.plugin,
      );
    });
    this.contentEl.createDiv({ cls: "releases" }, async (el) => {
      await MarkdownRenderer.render(
        this.plugin.app,
        changelogMd,
        el,
        "/",
        this.plugin,
      );
    });
  }
}
