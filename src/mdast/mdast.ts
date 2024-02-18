import * as mdast from "mdast-util-to-markdown";
import type { Nodes } from "mdast-util-to-markdown/lib";

const dashOrNumberWithMultipleSpaces = /(-|\d+[.)])\s+/g;
const escapedSquareBracket = /\\\[/g;

export function toMarkdown(nodes: Nodes) {
  return mdast
    .toMarkdown(nodes, { bullet: "-", listItemIndent: "tab" })
    .replace(dashOrNumberWithMultipleSpaces, "- ")
    .replace(escapedSquareBracket, "[");
}
