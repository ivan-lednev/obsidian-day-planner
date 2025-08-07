import { ItemView, WorkspaceLeaf } from "obsidian";
import { type Component, mount } from "svelte";

import { viewTypeLogSummary } from "../constants";
import type { ComponentContext } from "../types";

import LogSummary from "./components/log-summary.svelte";

export class LogSummaryView extends ItemView {
  private component?: Component;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly componentContext: ComponentContext,
  ) {
    super(leaf);
  }

  getViewType() {
    return viewTypeLogSummary;
  }

  getDisplayText() {
    return "Log summary";
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];

    contentEl.addClass("markdown-rendered");

    this.component = mount(LogSummary as never, {
      target: contentEl,
      context: this.componentContext,
    });
  }
}
