import { Effect } from "effect";
import { App, type IconName, setIcon, SuggestModal } from "obsidian";

import type { ClockLocation } from "../service/log-entry-editor";
import type { SearchOrderingService } from "../service/search-ordering-service";
import type { Match, SearchService } from "../service/search-service";
import type { VaultFacade } from "../service/vault-facade";
import { runWithNoticeOnError } from "../util/effect";
import { removeMarkdownExtension } from "../util/markdown";

interface CreateCandidate {
  type: "create";
  name: string;
}

type Suggestion = Match | CreateCandidate;

function getSuggestionIcon(item: Suggestion): IconName {
  if (item.type === "task") {
    return "list-checks";
  }

  if (item.type === "file") {
    return "file";
  }

  return "plus";
}

export interface ClockTargetLabels {
  placeholder: string;
  actionPurpose: string;
}

const clockInLabels: ClockTargetLabels = {
  placeholder: "Clock in on a task or a file...",
  actionPurpose: "to clock in",
};

export class ClockTargetModal extends SuggestModal<Suggestion> {
  private picked = false;

  constructor(
    app: App,
    private readonly searchService: SearchService,
    private readonly searchOrderingService: SearchOrderingService,
    private readonly vaultFacade: VaultFacade,
    private readonly onPicked: (location: ClockLocation | undefined) => void,
    labels: ClockTargetLabels = clockInLabels,
  ) {
    super(app);

    this.setPlaceholder(labels.placeholder);
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "↵", purpose: labels.actionPurpose },
      { command: "esc", purpose: "to dismiss" },
    ]);
  }

  async getSuggestions(query: string): Promise<Suggestion[]> {
    const matches = await this.searchService.search(query);
    const ordered = await this.searchOrderingService.order(matches);

    if (ordered.length === 0 && query.trim().length > 0) {
      return [{ type: "create", name: query.trim() }];
    }

    return ordered;
  }

  renderSuggestion(item: Suggestion, el: HTMLElement) {
    el.addClass("mod-complex");

    const content = el.createDiv({ cls: "suggestion-content" });

    if (item.type === "task") {
      content.createDiv({ cls: "suggestion-title", text: item.text });
      content.createDiv({ cls: "suggestion-note", text: item.path });
    } else if (item.type === "file") {
      content.createDiv({
        cls: "suggestion-title",
        text: removeMarkdownExtension(item.path),
      });
    } else {
      content.createDiv({
        cls: "suggestion-title",
        text: `Create "${item.name}.md"`,
      });
      content.createDiv({
        cls: "suggestion-note",
        text: "New file at vault root",
      });
    }

    const aux = el.createDiv({ cls: "suggestion-aux" });
    const iconEl = aux.createDiv({ cls: "suggestion-flair" });

    setIcon(iconEl, getSuggestionIcon(item));
  }

  async onChooseSuggestion(item: Suggestion) {
    this.picked = true;

    if (item.type !== "create") {
      this.onPicked(item);

      return;
    }

    const { vaultFacade } = this;
    const path = item.name.endsWith(".md") ? item.name : `${item.name}.md`;

    const created = await runWithNoticeOnError(
      Effect.tryPromise({
        try: () => vaultFacade.createFile(path, ""),
        catch: (error) =>
          new Error(`Could not create file ${path}`, { cause: error }),
      }),
    );

    this.onPicked(created ? { path } : undefined);
  }

  close() {
    // Note: we need to be able to run onChooseSuggestion before onClose
    window.setTimeout(() => {
      if (!this.picked) {
        this.onPicked(undefined);
      }

      super.close();
    });
  }
}

/**
 * Asks the user what to attach a clock to. Resolves to `undefined` when the
 * modal gets dismissed, so callers can cancel whatever they were about to write.
 */
export type PickClockTarget = (
  labels?: ClockTargetLabels,
) => Promise<ClockLocation | undefined>;
