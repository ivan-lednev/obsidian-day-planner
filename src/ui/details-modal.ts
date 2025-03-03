import { Modal, App, ButtonComponent, Setting } from "obsidian";

export interface DetailsModalProps {
  summary: string | null;
  description: string | null;
}

export class DetailsModal extends Modal {
  constructor(app: App, props: DetailsModalProps) {
    super(app);

    // Outlook events seem to contain links between <> instead of proper html or even markdown elements
    let description = props.description?.replace(
      /<(https?:\/\/[^>]+)>/g,
      '<a href="$1">$1</a>',
    );
    description = description?.replace(/\n/g, "<br>");

    const el = this.contentEl.createEl("div");
    el.innerHTML = description || "";
    this.setTitle(props.summary || "");

    new Setting(this.contentEl).addButton((btn: ButtonComponent) => {
      btn
        .setButtonText("Close")
        .setCta()
        .onClick(() => {
          this.close();
        });
    });
    this.close();
  }
}

export async function openDetailsModal(app: App, props: DetailsModalProps) {
  return new Promise<void>((resolve) => {
    new DetailsModal(app, props).open();
  });
}
