import { App, Modal } from "obsidian";

export interface ConfirmationModalProps {
  cta: string;
  onAccept: (event: MouseEvent) => Promise<void>;
  onCancel: (event: MouseEvent) => void;
  text: string;
  title: string;
}

class ConfirmationModal extends Modal {
  constructor(app: App, props: ConfirmationModalProps) {
    super(app);

    const { cta, onAccept, text, title, onCancel } = props;

    this.contentEl.createEl("h2", { text: title });
    this.contentEl.createEl("p", { text });

    this.contentEl.createDiv("day-planner-modal-buttons", (buttonsEl) => {
      buttonsEl
        .createEl("button", { text: "Cancel" })
        .addEventListener("click", (e) => {
          onCancel(e);
          this.close();
        });

      buttonsEl
        .createEl("button", {
          cls: "mod-cta",
          text: cta,
        })
        .addEventListener("click", async (e) => {
          await onAccept(e);

          this.close();
        });
    });
  }
}

export async function askForConfirmation(props: {
  app: App;
  title: string;
  text: string;
  cta: string;
}) {
  return new Promise((resolve) => {
    const { app, ...rest } = props;

    new ConfirmationModal(app, {
      ...rest,
      onAccept: async () => resolve(true),
      onCancel: () => resolve(false),
    }).open();
  });
}
