import { isNotVoid } from "typed-assert";

import { codeFence } from "../constants";
import {
  checkboxRegExp,
  headingRegExp,
  listTokenWithSpacesRegExp,
  repeatingNewlinesRegExp,
} from "../regexp";
import type { DayPlannerSettings } from "../settings";

const baseIndentation = "\t";

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
  return lines.map((line) => indentation + line);
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

// todo: account for user settings
export function createIndentation(level: number) {
  return baseIndentation.repeat(level);
}

export function checkbox(status: string) {
  return `[${status}]`;
}

export function appendHeading(contents: string, heading: string) {
  let result = contents;

  if (contents.length > 0) {
    result = result.trimEnd();
    result = result.concat("\n", "\n");
  }

  return result.concat(heading, "\n", "\n");
}

/**
 * We need to limit our updates to the scope of the heading because mdast-util-to-markdown breaks invalid markdown that we see in user templates.
 */
export function applyScopedUpdates(
  contents: string,
  headingScope: string,
  updateFn: (scopedContents: string) => string,
  settings?: { createHeading: boolean; settings: DayPlannerSettings },
) {
  if (headingScope.trim().length === 0) {
    return contents;
  }

  const heading = findHeading(contents, headingScope);

  if (heading?.start === undefined) {
    if (settings?.createHeading) {
      const { plannerHeadingLevel, plannerHeading } = settings.settings;
      const withHeading = appendHeading(
        contents,
        createHeading(plannerHeadingLevel, plannerHeading),
      );

      return applyScopedUpdates(withHeading, headingScope, updateFn);
    }

    return contents;
  }

  const lines = contents.split("\n");
  const beforeHeading = lines.slice(0, heading.start);
  const afterHeadingIndex = heading.start + heading.length;
  const toUpdate = lines.slice(heading.start, afterHeadingIndex).join("\n");
  const afterHeading = lines.slice(afterHeadingIndex);

  const updated = updateFn(toUpdate).split("\n");

  return beforeHeading.concat(updated, afterHeading).join("\n");
}

function findHeadingInLine(line: string) {
  // todo: remove exec, it's cursed
  const headingMatch = headingRegExp.exec(line);

  if (!headingMatch) {
    return undefined;
  }

  const [, tokens] = headingMatch;

  return { level: tokens.length };
}

function findHeading(text: string, headingText: string) {
  const lines = text.split("\n");

  const result: {
    start: number | undefined;
    length: number;
    level: number;
  } = {
    start: undefined,
    length: 0,
    level: 0,
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = findHeadingInLine(line);
    const insideHeading = result.start !== undefined;

    if (insideHeading) {
      if (heading && heading.level <= result.level) {
        return result;
      }

      result.length++;
    } else {
      if (heading && line.includes(headingText)) {
        result.start = i;
        result.level = heading.level;
        result.length = 1;
      }
    }
  }

  if (result.start === undefined) {
    return undefined;
  }

  return result;
}

export function createCodeBlock(props: {
  language: "yaml" | "yml";
  text: string;
}) {
  return codeFence + props.language + "\n" + props.text + codeFence;
}
