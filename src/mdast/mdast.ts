import type { Node, Parent, RootContent } from "mdast";
import { Point } from "mdast-util-from-markdown/lib";
import * as mdast from "mdast-util-to-markdown";
import type { Nodes } from "mdast-util-to-markdown/lib";

const dashOrNumberWithMultipleSpaces = /(-|\d+[.)])\s+/g;
const escapedSquareBracket = /\\\[/g;

// NOTE: re-export for consistency
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
  searchedNodeType,
}: {
  tree: Node;
  /** Both line and column are 1-indexed. */
  point: Point;
  /**
   * The type of the searched node.
   *
   * {@link findNodeAtPoint} will only return nodes of this type.
   */
  searchedNodeType: SearchedNodeType;
}): SearchedNode | undefined {
  if (!positionContainsPoint(tree.position, point)) {
    // Point is outside of the current node, no need to look further
    return undefined;
  }

  if (tree.type === searchedNodeType) {
    // SAFETY: node types in mdast are unique
    return tree as SearchedNode;
  }

  if (isParent(tree)) {
    // Attempt to find a more specific child node at that point
    const childAtPoint = tree.children.find((child) =>
      findNodeAtPoint<SearchedNodeType, SearchedNode>({
        tree: child,
        point,
        searchedNodeType,
      }),
    );
    if (childAtPoint) {
      // SAFETY: node types in mdast are unique
      return childAtPoint as SearchedNode;
    }
  }

  // The current node is not the searched node, and it doesn't have children
  // that are the searched node.
  return undefined;
}

function isParent(node: Node): node is Parent {
  return "children" in node;
}

function positionContainsPoint(position: Node["position"], point: Point) {
  return (
    position.start.line <= point.line &&
    position.end.line >= point.line &&
    position.start.column <= point.column &&
    position.end.column >= point.column
  );
}
