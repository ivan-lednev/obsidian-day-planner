import { Effect } from "effect";
import { App, type IconName, setIcon, SuggestModal } from "obsidian";

import type { LogEntryEditor } from "../service/log-entry-editor";
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

export class ClockInOnAnythingModal extends SuggestModal<Suggestion> {
  constructor(
    app: App,
    private readonly searchService: SearchService,
    private readonly searchOrderingService: SearchOrderingService,
    private readonly vaultFacade: VaultFacade,
    private readonly logEntryEditor: LogEntryEditor,
  ) {
    super(app);

    this.setPlaceholder("Clock in on a task or a file...");
    this.setInstructions([
      { command: "↑↓", purpose: "to navigate" },
      { command: "↵", purpose: "to clock in" },
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
    const { logEntryEditor, vaultFacade } = this;

    if (item.type === "create") {
      const path = item.name.endsWith(".md") ? item.name : `${item.name}.md`;

      return runWithNoticeOnError(
        Effect.gen(function* () {
          yield* Effect.tryPromise({
            try: () => vaultFacade.createFile(path, ""),
            catch: (error) =>
              new Error(`Could not create file ${path}`, { cause: error }),
          });

          yield* logEntryEditor.clockIn({ path });
        }),
      );
    }

    return runWithNoticeOnError(logEntryEditor.clockIn(item));
  }
}
