import { Notice } from "obsidian";

import { undoTimeoutMillis } from "../constants";

export function createUndoNotice(onpointerup: () => void) {
  const notice = new Notice(
    createFragment((fragment) => {
      fragment.appendText("Changes saved. ");
      fragment.append(
        createEl("a", { text: "UNDO" }, (el) => {
          el.addEventListener("pointerup", onpointerup, {
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

  notice.noticeEl.addClass("planner-undo-notice");

  return notice;
}
