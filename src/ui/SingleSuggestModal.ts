import { App, SuggestModal } from "obsidian";

type Suggestion = { text: string };

// todo: move to file
export class SingleSuggestModal extends SuggestModal<Suggestion> {
  constructor(
    private readonly props: {
      app: App;
      getDescriptionText: (input: string) => string;
      onChooseSuggestion: (suggestion: Suggestion) => void;
      onClose: () => void;
    },
  ) {
    super(props.app);

    this.setInstructions([
      { command: "esc", purpose: "to dismiss" },
      { command: "↵", purpose: "to confirm" },
    ]);
  }

  getSuggestions(query: string) {
    return [
      {
        text: query,
      },
    ];
  }

  renderSuggestion(item: Suggestion, el: HTMLElement) {
    el.createDiv({ text: this.props.getDescriptionText(item.text) });
  }

  onChooseSuggestion(item: Suggestion, evt: MouseEvent | KeyboardEvent) {
    this.props.onChooseSuggestion(item);
  }

  onClose() {
    super.onClose();

    this.props.onClose();
  }
}

