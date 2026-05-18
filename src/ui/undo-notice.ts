import { Notice } from "obsidian";

import { undoTimeoutMillis } from "../constants";

export class UndoNotice {
  private current: Notice | undefined;

  constructor(private readonly onUndo: () => void) {}

  show = () => {
    this.current?.hide();
    this.current = new Notice(
      createFragment((fragment) => {
        fragment.appendText("Changes saved. ");
        fragment.append(
          createEl("a", { text: "UNDO" }, (el) => {
            el.addEventListener("pointerup", this.onUndo, {
              once: true,
            });
          }),
          createEl("div", { cls: "undo-timeout-bar" }, (el) => {
            el.style.animation = `${undoTimeoutMillis}ms linear forwards shrink`;
          }),
        );
      }),
      undoTimeoutMillis,
    );
  };
}
