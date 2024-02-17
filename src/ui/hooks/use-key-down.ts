import { readable } from "svelte/store";

export function useKeyDown() {
  return readable({}, (set) => {
    const trigger = (event: KeyboardEvent) => set(event);
    document.addEventListener("keydown", trigger);

    return () => {
      document.removeEventListener("keydown", trigger);
    };
  });
}
