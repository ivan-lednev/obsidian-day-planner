import chroma from "chroma-js";
import type { HexString } from "obsidian";

export interface ContrastColors {
  normal: HexString;
  muted: HexString;
  faint: HexString;
}

// just using values from the default themes to get good gradients for light and dark colors
const lightThemeColors: ContrastColors = {
  normal: "#222222",
  muted: "#5c5c5c",
  faint: "#666666",
};

const darkThemeColors: ContrastColors = {
  normal: "#dadada",
  muted: "#b3b3b3",
  faint: "#ababab",
};

export function getTextColorWithEnoughContrast(
  backgroundColor: HexString,
): ContrastColors {
  return chroma.contrast(backgroundColor, darkThemeColors.normal) >
    chroma.contrast(backgroundColor, lightThemeColors.normal)
    ? darkThemeColors
    : lightThemeColors;
}
