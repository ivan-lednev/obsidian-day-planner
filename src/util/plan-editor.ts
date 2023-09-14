import type { MetadataCache } from "obsidian";

import { getHeadingByText, getListItemsUnderHeading } from "../parser/parser";
import { replaceTimestamp } from "../parser/timestamp/timestamp";
import type { DayPlannerSettings } from "../settings";
import type { PlanItem } from "../types";

import { selectText } from "./editor";
import type { ObsidianFacade } from "./obsidian-facade";

export class PlanEditor {
  constructor(
    private readonly settings: DayPlannerSettings,
    private readonly metadataCache: MetadataCache,
    private readonly obsidianFacade: ObsidianFacade,
  ) {}

  createPlannerHeading() {
    const { plannerHeading, plannerHeadingLevel } = this.settings;

    const headingTokens = "#".repeat(plannerHeadingLevel);

    return `${headingTokens} ${plannerHeading}`;
  }

  // todo: replace with mdast-util-from-markdown + custom stringify
  async appendToPlan(path: string, planItem: PlanItem) {
    const { plannerHeading } = this.settings;

    const file = this.obsidianFacade.getFileByPath(path);
    const metadata = this.metadataCache.getFileCache(file) || {};
    const editor = await this.obsidianFacade.openFileInEditor(file);

    let line = editor.lastLine();
    let result = replaceTimestamp(planItem, { ...planItem });

    const cachedHeading = getHeadingByText(metadata, plannerHeading);

    if (cachedHeading) {
      line = cachedHeading.position.start.line;
    } else {
      result = `${this.createPlannerHeading()}\n\n${result}`;
    }

    const listItems = getListItemsUnderHeading(metadata, plannerHeading);

    if (listItems?.length > 0) {
      const lastListItem = listItems[listItems.length - 1];

      line = lastListItem.position.start.line;
    } else if (cachedHeading) {
      result = `\n${result}`;
    }

    const ch = editor.getLine(line).length;

    editor.replaceRange(`\n${result}`, { line, ch });

    selectText(editor, planItem.firstLineText);
  }
}
