import { Keymap } from "obsidian";
import { readable } from "svelte/store";

export function useModPressed() {
  return readable(false, (set) => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (Keymap.isModifier(event, "Mod")) {
        set(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!Keymap.isModifier(event, "Mod")) {
        set(false);
      }
    };

    const handleBlur = () => {
      set(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  });
}
