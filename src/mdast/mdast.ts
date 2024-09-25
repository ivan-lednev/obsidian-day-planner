import { takeWhile } from "lodash/fp";
import type { Node, Parent, RootContent, Text as MdastText } from "mdast";
import { type Heading, type Root } from "mdast-util-from-markdown/lib";
import * as mdast from "mdast-util-to-markdown";
import type { Nodes, Point } from "mdast-util-to-markdown/lib/types";
import type { EditorPosition } from "obsidian";
import { isExactly, isNotVoid } from "typed-assert";

import { compareTimestamps } from "../parser/parser";
import {
  dashOrNumberWithMultipleSpaces,
  escapedSquareBracket,
} from "../regexp";

export { fromMarkdown } from "mdast-util-from-markdown";

export function toMarkdown(nodes: Nodes) {
  return mdast
    .toMarkdown(nodes, { bullet: "-", listItemIndent: "tab" })
    .replace(dashOrNumberWithMultipleSpaces, "- ")
    .replace(escapedSquareBracket, "[");
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

export function sortListsRecursively(
  root: RootContent,
  sortFn: (a: Node, b: Node) => number = compareAlphabetically,
) {
  if (root.type !== "list") {
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
      .sort(sortFn),
  };
}

function compareAlphabetically(a: Node, b: Node) {
  const aText = getFirstTextNodeValue(a);
  const bText = getFirstTextNodeValue(b);

  isNotVoid(aText);
  isNotVoid(bText);

  return aText.localeCompare(bText);
}

export function compareByTimestampInText(a: Node, b: Node) {
  // todo: remove duplication
  const aText = getFirstTextNodeValue(a);
  const bText = getFirstTextNodeValue(b);

  isNotVoid(aText);
  isNotVoid(bText);

  return compareTimestamps(aText, bText);
}

export function getFirstTextNodeValue(node: Node) {
  if (isParentNode(node)) {
    if (node.children.length === 0) {
      return null;
    }

    const firstNode = node.children[0];

    isNotVoid(firstNode);

    return getFirstTextNodeValue(firstNode);
  }

  return isTextNode(node) ? node.value : null;
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

// todo: move out
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
