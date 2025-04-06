import { isNotVoid } from "typed-assert";

import {
  checkboxRegExp,
  listTokenWithSpacesRegExp,
  repeatingNewlinesRegExp,
} from "../regexp";

export function toggleCheckbox(line: string) {
  if (line.includes("[ ]")) {
    return line.replace("[ ]", "[x]");
  }

  return line.replace("[x]", "[ ]");
}

export function createHeading(level: number, text: string) {
  return `${"#".repeat(level)} ${text}`;
}

export function updateLine(
  contents: string,
  lineNumber: number,
  editFn: (line: string) => string,
) {
  const lines = contents.split("\n");
  const originalLine = lines[lineNumber];

  isNotVoid(
    originalLine,
    `No line #${lineNumber} in text with ${lines.length} lines`,
  );

  lines[lineNumber] = editFn(originalLine);

  return lines.join("\n");
}

export function normalizeNewlines(text: string) {
  return text.replaceAll(repeatingNewlinesRegExp, "\n");
}

export function indentLines(lines: string[], indentation: string) {
  return lines.map((line) => `${indentation}${line}`);
}

export function indent(text: string, indentation: string) {
  return indentLines(text.split("\n"), indentation).join("\n");
}

export function getFirstLine(text: string) {
  return text.split("\n")[0];
}

export function getLinesAfterFirst(text: string) {
  return text.split("\n").slice(1).join("\n");
}

export function removeListTokens(text: string) {
  return text
    .replace(listTokenWithSpacesRegExp, "")
    .replace(checkboxRegExp, "");
}
