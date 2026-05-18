import { App, SuggestModal } from "obsidian";

type Suggestion = { text: string };

export class SingleSuggestModal extends SuggestModal<Suggestion> {
  constructor(
    private readonly props: {
      app: App;
      getDescriptionText: (input: string) => string;
      onChooseSuggestion: (suggestion: Suggestion) => void;
      onClose: () => void;
      initialValue?: string;
    },
  ) {
    super(props.app);

    this.setInstructions([
      { command: "esc", purpose: "to dismiss" },
      { command: "↵", purpose: "to confirm" },
    ]);
  }

  onOpen() {
    super.onOpen();

    if (this.props.initialValue !== undefined) {
      this.inputEl.value = this.props.initialValue;
      // todo: this is doubtful
      this.inputEl.dispatchEvent(new Event("input"));
      this.inputEl.select();
    }
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

  close() {
    // Note: we need to be able to run onChooseSuggestion before onClose
    window.setTimeout(() => {
      this.props.onClose();
      super.close();
    });
  }
}
