import { Workspace } from "obsidian";
import { fromStore, readable } from "svelte/store";

import { useIsOnline } from "../ui/hooks/use-is-online";
import { useKeyDown } from "../ui/hooks/use-key-down";
import { useModPressed } from "../ui/hooks/use-mod-pressed";

import { getDarkModeFlag } from "./dom";

export function createEnvironmentHooks(props: { workspace: Workspace }) {
  const { workspace } = props;

  const layoutReady = readable(false, (set) => {
    workspace.onLayoutReady(() => set(true));
  });

  const isDarkModeStore = readable(getDarkModeFlag(), (set) => {
    const eventRef = workspace.on("css-change", () => {
      set(getDarkModeFlag());
    });

    return () => {
      workspace.offref(eventRef);
    };
  });
  const isDarkMode = fromStore(isDarkModeStore);

  const keyDown = useKeyDown();
  const isModPressed = useModPressed();
  const isOnline = useIsOnline();

  return {
    isDarkMode,
    keyDown,
    isModPressed,
    isOnline,
    layoutReady,
  };
}
