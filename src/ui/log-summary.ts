import { ItemView, View, WorkspaceLeaf } from "obsidian";
import { viewTypeLogSummary } from "../constants";
import { type Component, mount } from "svelte";
import LogSummary from "./components/log-summary.svelte";
import type { ComponentContext } from "../types";
import { isNotVoid } from "typed-assert";

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
