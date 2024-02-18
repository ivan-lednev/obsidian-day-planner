import * as mdast from "mdast-util-to-markdown";
import type { Nodes } from "mdast-util-to-markdown/lib";

export function toMarkdown(nodes: Nodes) {
  return mdast
    .toMarkdown(nodes, { bullet: "-", listItemIndent: "tab" })
    .replace(/(-|\d+[.)])\s+/g, "- ")
    .replace(/\\\[/g, "[");
}
