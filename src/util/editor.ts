import type { Editor, Loc } from "obsidian";

export function selectText(editor: Editor, text: string) {
  const startOffset = editor.getValue().lastIndexOf(text);
  const endOffset = startOffset + text.length;

  editor.setSelection(
    editor.offsetToPos(startOffset),
    editor.offsetToPos(endOffset),
  );
}
export function locToEditorPosition({ line, col }: Loc) {
  return { line, ch: col };
}
