// TODO: remove this once lucide is aware of Svelte 5 component typings
// @ts-nocheck
import * as lucideSvelte from "lucide-svelte";
import type { Component, ComponentProps } from "svelte";

/* eslint-disable @typescript-eslint/no-explicit-any */
const obsidianIcon =
  <T extends Component<any>>(IconComponent: T) =>
  (internals: any, props: ComponentProps<T>) => {
    const newProps = {
      ...props,
      ["class"]: `${props.className || ""} svg-icon`,
    };

    return IconComponent(internals, newProps);
  };
/* eslint-enable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/naming-convention */
export const Settings = obsidianIcon(lucideSvelte.Settings);
export const ChevronLeft = obsidianIcon(lucideSvelte.ChevronLeft);
export const ChevronRight = obsidianIcon(lucideSvelte.ChevronRight);
export const CalendarArrowUp = obsidianIcon(lucideSvelte.CalendarArrowUp);
export const Columns3 = obsidianIcon(lucideSvelte.Columns3);
export const Search = obsidianIcon(lucideSvelte.Search);
/* eslint-enable @typescript-eslint/naming-convention */
