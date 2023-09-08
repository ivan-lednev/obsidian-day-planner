import type { App } from "obsidian";
import { writable } from "svelte/store";

export const appStore = writable<App>();
