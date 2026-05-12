import { ItemView, WorkspaceLeaf } from "obsidian";
import { mount, unmount } from "svelte";
import type { Component } from "svelte";

import { viewTypeTimeTracker } from "../constants";
import type { ComponentContext } from "../types";

import TimeTrackerWithControls from "./components/time-tracker-with-controls.svelte";

export default class TimeTrackerView extends ItemView {
  private component?: Component;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly componentContext: ComponentContext,
  ) {
    super(leaf);
  }

  getViewType(): string {
    return viewTypeTimeTracker;
  }

  getDisplayText(): string {
    return "Time Tracker";
  }

  getIcon() {
    return "timer";
  }

  async onOpen() {
    const contentEl = this.containerEl.children[1];

    contentEl.addClass("planner-flex-container");

    // @ts-expect-error
    this.component = mount(TimeTrackerWithControls, {
      target: contentEl,
      context: this.componentContext,
    });
  }

  async onClose() {
    if (this.component) {
      await unmount(this.component);
    }
  }
}
