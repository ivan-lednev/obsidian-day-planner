import type { App } from "obsidian";
import { writable } from "svelte/store";

// todo: remove
export const appStore = writable<App>();
