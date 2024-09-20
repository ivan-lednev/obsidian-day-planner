import type { Node, Parent, RootContent, Text as MdastText } from "mdast";
import { type Point } from "mdast-util-from-markdown/lib";
import * as mdast from "mdast-util-to-markdown";
import type { Nodes } from "mdast-util-to-markdown/lib";
import { isNotVoid } from "typed-assert";

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

export function findNodeAtPoint<
  SearchedNodeType extends RootContent["type"],
  SearchedNode = Extract<RootContent, { type: SearchedNodeType }>,
>({
  tree,
  point,
  type,
}: {
  tree: Node;
  point: Point;
  type: SearchedNodeType;
}): SearchedNode | undefined {
  isNotVoid(tree.position);

  if (!positionContainsPoint(tree.position, point)) {
    return undefined;
  }

  if (tree.type === type) {
    // todo: fix type
    return tree;
  }

  if (isParentNode(tree)) {
    const childAtPoint = tree.children.find((child) =>
      findNodeAtPoint<SearchedNodeType, SearchedNode>({
        tree: child,
        point,
        type: type,
      }),
    );

    if (childAtPoint) {
      // todo: fix type
      return childAtPoint;
    }
  }

  return undefined;
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

function positionContainsPoint(
  position: NonNullable<Node["position"]>,
  point: Point,
) {
  return (
    position.start.line <= point.line &&
    position.end.line >= point.line &&
    position.start.column <= point.column &&
    position.end.column >= point.column
  );
}
