import { type CachedMetadata, parseYaml } from "obsidian";
import { codeFence } from "../constants";

const listItemWithPropertiesMinSpan = 3;

export function getPropertiesFromListItems(
  fileContent: string,
  metadata: CachedMetadata,
) {
  return metadata.listItems?.reduce<{ [line: number]: unknown }>(
    (result, listItem) => {
      const listLineSpan =
        listItem.position.end.line - listItem.position.start.line;

      if (listLineSpan < listItemWithPropertiesMinSpan) {
        return result;
      }

      const listContent = fileContent.slice(
        listItem.position.start.offset,
        listItem.position.end.offset,
      );

      const listLines = listContent.split("\n");
      const secondLine = listLines[1];

      if (!secondLine.trimStart().startsWith(codeFence + "yaml")) {
        return result;
      }

      const linesAfterSecond = listLines.slice(2);

      const closingLineIndex = linesAfterSecond.findIndex((line) =>
        line.trimStart().startsWith(codeFence),
      );

      if (closingLineIndex === -1) {
        return result;
      }

      const linesInsideCodeBlock = linesAfterSecond.slice(0, closingLineIndex);

      try {
        result[listItem.position.start.line] = parseYaml(
          linesInsideCodeBlock.join("\n"),
        );
      } catch (error) {
        console.error(error);
      }

      return result;
    },
    {},
  );
}
