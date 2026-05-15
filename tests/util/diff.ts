import { diffLines } from "diff";
import { isNotVoid } from "typed-assert";

import type { InMemoryFile } from "./fakes";

export function getLineDiff(v1: string, v2: string) {
  return diffLines(v1, v2)
    .reduce<Array<string>>((result, current, index, array) => {
      if (current.added || current.removed) {
        const prefix = current.added ? "+ " : "- ";
        const changed = current.value
          .trimEnd()
          .split("\n")
          .map((line) => prefix + line);

        return result.concat(changed);
      } else if (index !== 0 && index !== array.length - 1) {
        return result.concat("...");
      }

      return result;
    }, [])
    .join("\n");
}

export function getPathToDiff(
  v1: Array<InMemoryFile>,
  v2: Array<InMemoryFile>,
) {
  return v1.reduce<Record<string, string>>((result, current) => {
    const newVersion = v2.find((it) => it.path === current.path);

    isNotVoid(
      newVersion,
      "The file from the original got deleted. This scenario is not supported in tests",
    );

    const changedLines = getLineDiff(current.contents, newVersion.contents);

    if (changedLines.length > 0) {
      result[current.path] = `\n${changedLines}\n`;
    }

    return result;
  }, {});
}
