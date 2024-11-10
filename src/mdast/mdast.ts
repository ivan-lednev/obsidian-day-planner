import { produce } from "immer";
import { takeWhile } from "lodash/fp";
import type { Node, Parent, Text as MdastText, ListItem } from "mdast";
import type { Heading, List, Root, Nodes } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import * as mdast from "mdast-util-to-markdown";
import type { EditorPosition } from "obsidian";
import { check, isExactly, isNotVoid } from "typed-assert";
import type { Point } from "unist";

import { mdastUtilNumberOfSpacesInTab } from "../constants";
import { compareTimestamps } from "../parser/parser";
import {
  dashOrNumberWithMultipleSpaces,
  escapedSquareBracket,
  mdastUtilListIndentationSpaces,
} from "../regexp";

export { fromMarkdown };

export function toMarkdown(nodes: Nodes) {
  return listIndentationSpacesToTabs(
    mdast
      .toMarkdown(nodes, { bullet: "-", listItemIndent: "tab" })
      .replace(dashOrNumberWithMultipleSpaces, "- ")
      .replace(escapedSquareBracket, "["),
  );
}

export function sortListsRecursivelyInMarkdown(contents: string) {
  const root = fromMarkdown(contents);

  const sorted = {
    ...root,
    children: root.children.map((child) =>
      sortListsRecursively(child, compareByTimestampInText),
    ),
  };

  return toMarkdown(sorted);
}

export function findHeadingWithChildren(
  root: Root,
  text: string,
): Root | undefined {
  const planHeadingIndex = root.children.findIndex((node) => {
    return node.type === "heading" && getFirstTextNodeValue(node) === text;
  });

  if (planHeadingIndex < 0) {
    return undefined;
  }

  const planHeading = root.children[planHeadingIndex];

  isHeading(planHeading);

  const nodesAfterHeading = root.children.slice(planHeadingIndex + 1);

  const nodesBeforeNextHeading = takeWhile(
    (node) => node.type !== "heading" || node.depth > planHeading.depth,
    nodesAfterHeading,
  );

  return {
    type: "root",
    children: [planHeading, ...nodesBeforeNextHeading],
  };
}

export function sortListsRecursively<T extends Node>(
  root: T,
  sortFn: (a: Node, b: Node) => number = compareAlphabetically,
): T {
  if (!checkList(root)) {
    return root;
  }

  return {
    ...root,
    children: root.children
      .map((listItem) => ({
        ...listItem,
        children: listItem.children.map((child) =>
          sortListsRecursively(child, sortFn),
        ),
      }))
      .toSorted(sortFn),
  };
}

export function findFirst(
  node: Node,
  predicate: (node: Node) => boolean,
): Node | undefined {
  if (predicate(node)) {
    return node;
  }

  if (isParentNode(node)) {
    for (const child of node.children) {
      const found = findFirst(child, predicate);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

export function updateFirst(node: Node, updateFn: (node: Node) => boolean) {
  return produce(node, (draft) => {
    if (updateFn(draft)) {
      return;
    }

    if (isParentNode(draft)) {
      for (const child of draft.children) {
        const found = updateFirst(child, updateFn);

        if (found) {
          return;
        }
      }
    }
  });
}

export function insertListItemUnderHeading(
  root: Root,
  heading: string,
  listItem: ListItem,
) {
  return produce(root, (draft) => {
    const headingIndex = draft.children.findIndex(
      (child) =>
        checkHeading(child) && getFirstTextNodeValue(child) === heading,
    );

    if (headingIndex >= 0) {
      const afterHeading = draft.children.slice(headingIndex + 1);

      const nextHeadingIndex = afterHeading.findIndex((child) =>
        checkHeading(child),
      );

      const end = nextHeadingIndex === -1 ? undefined : nextHeadingIndex;
      const underHeading = afterHeading.slice(0, end);

      const list = underHeading.find((child) => checkList(child));

      if (list) {
        list.children.push(listItem);
      } else {
        draft.children.splice(headingIndex + 1, 0, {
          type: "list",
          children: [listItem],
        });
      }
    } else {
      draft.children.push(
        {
          type: "heading",
          depth: 1,
          children: [
            {
              type: "text",
              value: heading,
            },
          ],
        },
        {
          type: "list",
          children: [listItem],
        },
      );
    }
  });
}

function compareAlphabetically(a: Node, b: Node) {
  const aText = getFirstTextNodeValue(a);
  const bText = getFirstTextNodeValue(b);

  return aText.localeCompare(bText);
}

export function compareByTimestampInText(a: Node, b: Node) {
  const aText = getFirstTextNodeValue(a);
  const bText = getFirstTextNodeValue(b);

  return compareTimestamps(aText, bText);
}

export function getFirstTextNodeValue(node: Node) {
  if (isParentNode(node)) {
    if (node.children.length === 0) {
      return "";
    }

    const firstNode = node.children[0];

    isNotVoid(firstNode);

    return getFirstTextNodeValue(firstNode);
  }

  return isTextNode(node) ? node.value : "";
}

export function isParentNode(node: Node): node is Parent {
  return Object.hasOwn(node, "children");
}

export function isTextNode(node: Node): node is MdastText {
  return node.type === "text";
}

export function isHeading(node: Node): asserts node is Heading {
  return isExactly(node.type, "heading");
}

export function isList(node: Node): asserts node is List {
  return isExactly(node.type, "list");
}

export function isListItem(node: Node): asserts node is ListItem {
  return isExactly(node.type, "listItem");
}

export const checkList = check(isList);
export const checkHeading = check(isHeading);
export const checkListItem = check(isListItem);

export function positionContainsPoint(
  { start, end }: NonNullable<Node["position"]>,
  point: Point,
) {
  return (
    (start.line < point.line ||
      (start.line === point.line && start.column <= point.column)) &&
    (end.line > point.line ||
      (end.line === point.line && end.column >= point.column))
  );
}

export function toEditorPos(mdastPoint: Point) {
  return {
    line: mdastPoint.line - 1,
    ch: mdastPoint.column - 1,
  };
}

export function toMdastPoint(editorPosition: EditorPosition) {
  return {
    line: editorPosition.line + 1,
    column: editorPosition.ch + 1,
  };
}

/**
 * mdast-util uses 4 spaces for a tab, Obsidian uses a tab character. That's why we need this conversion
 */
export function listIndentationSpacesToTabs(input: string) {
  return input.replace(mdastUtilListIndentationSpaces, (match) => {
    const tabCount = match.length / mdastUtilNumberOfSpacesInTab;

    return "\t".repeat(tabCount);
  });
}
