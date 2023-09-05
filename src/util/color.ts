import chroma from "chroma-js";
import type { HexString } from "obsidian";

export interface IContrastColors {
  normal: HexString;
  muted: HexString;
  faint: HexString;
}

// just using values from the default themes to get good gradients for light and dark colors
const LightThemeColors: IContrastColors = {
  normal: "#222222",
  muted: "#5c5c5c",
  faint: "#666666",
};
const DarkThemeColors: IContrastColors = {
  normal: "#dadada",
  muted: "#b3b3b3",
  faint: "#ababab",
};

export function getTextColorWithEnoughContrast(
  backgroundColor: HexString,
): IContrastColors {
  return chroma.contrast(backgroundColor, DarkThemeColors.normal) >
    chroma.contrast(backgroundColor, LightThemeColors.normal)
    ? DarkThemeColors
    : LightThemeColors;
}
