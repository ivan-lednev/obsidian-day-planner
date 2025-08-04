import {
  type CachedMetadata,
  type ListItemCache,
  type MetadataCache,
  parseYaml,
  type Vault,
} from "obsidian";

import { codeFence } from "../constants";
import type { LineToListProps } from "../redux/dataview/dataview-slice";

const listItemWithPropertiesMinSpan = 3;

export async function getListPropsForPath(
  path: string,
  { vault, metadataCache }: { vault: Vault; metadataCache: MetadataCache },
) {
  const file = vault.getFileByPath(path);

  if (!file) {
    return;
  }

  const metadata = metadataCache.getFileCache(file);

  if (!metadata?.listItems) {
    return;
  }

  const contents = await vault.cachedRead(file);

  return getListPropsFromFile(contents, metadata);
}

function getListPropsFromFile(fileText: string, metadata: CachedMetadata) {
  return metadata.listItems?.reduce<LineToListProps>((result, listItem) => {
    const listLineSpan =
      listItem.position.end.line - listItem.position.start.line;

    if (listLineSpan < listItemWithPropertiesMinSpan) {
      return result;
    }

    const listContent = fileText.slice(
      listItem.position.start.offset,
      listItem.position.end.offset,
    );

    const props = getListPropsFromListItem(listItem, listContent);

    if (props) {
      result[listItem.position.start.line] = props;
    }

    return result;
  }, {});
}

function getListPropsFromListItem(
  listItem: ListItemCache,
  listItemText: string,
) {
  const listLines = listItemText.split("\n");
  const firstLine = listLines[0];
  const openingLine = listLines.at(1);

  if (!openingLine?.trimStart().startsWith(codeFence + "yaml")) {
    return;
  }

  const indentation = openingLine.match(/^\s*/)?.[0];
  const linesAfterSecond = listLines.slice(2);

  const closingLineIndex = linesAfterSecond.findIndex((line) =>
    line.trimStart().startsWith(codeFence),
  );

  if (closingLineIndex === -1) {
    return;
  }

  const closingLine = linesAfterSecond[closingLineIndex];
  const linesInsideCodeBlock = linesAfterSecond.slice(0, closingLineIndex);
  const textInsideCodeBlock = linesInsideCodeBlock.join("\n");

  const trimmedTextInsideCodeBlock = linesInsideCodeBlock
    .map((line) => (indentation ? line.slice(indentation.length) : line))
    .join("\n");

  let parsed;

  try {
    parsed = parseYaml(trimmedTextInsideCodeBlock);
  } catch (error) {
    console.error(error);
  }

  if (!parsed) {
    return;
  }

  const startLine = listItem.position.start.line + 1;
  const startOffset = listItem.position.start.offset + firstLine.length + 1;

  const endLine = startLine + linesInsideCodeBlock.length + 1;
  const codeBlockLength = [openingLine, textInsideCodeBlock, closingLine].join(
    "\n",
  ).length;
  const endOffset = startOffset + codeBlockLength;

  const position = {
    start: {
      line: listItem.position.start.line + 1,
      // todo: use real col ?
      col: 0,
      offset: startOffset,
    },
    end: {
      line: endLine,
      col: closingLine.length,
      offset: endOffset,
    },
  };

  const codeBlockLines = [openingLine].concat(
    linesInsideCodeBlock,
    closingLine,
  );

  return {
    parsed,
    position,
    // todo: not needed
    raw: codeBlockLines.join("\n"),
  };
}
