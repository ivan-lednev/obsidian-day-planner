import { isNotVoid } from "typed-assert";

import {
  compareByTimestampInText,
  findHeadingWithChildren,
  findNodeAtPoint,
  fromMarkdown,
  sortListsRecursively,
  toMarkdown,
} from "./mdast";

test("roundtripping doesn't mess up Obsidian-styled markdown", () => {
  const input = `# [[Heading]]

- [!] This is ![[custom syntax]] all #over the place ^block-id
    \`\`\`js
    console.log("this is a code block");
    \`\`\`
- [x] 1 [key:: value]
    - [ ] 2

| table | blah |
|-------|------|
| key   | val  |
`;
  const parsed = fromMarkdown(input);

  expect(toMarkdown(parsed)).toEqual(input);
});

test("find the list at a point", () => {
  const listInput = `- [ ] 10:00 - 11:00 Wake up
- [ ] 11:00 - 12:00 Eat breakfast`;

  const input = `# 2024-04-13

## Plan

${listInput}`;

  const listNode = findNodeAtPoint({
    tree: fromMarkdown(input),
    point: {
      line: 5,
      column: 8,
    },
    type: "list",
  });

  isNotVoid(listNode);

  expect(toMarkdown(listNode)).toBe(listInput + "\n");
});

test("Find heading position", () => {
  const input = `1
2

# Target

text

## Sub-heading

sub-heading text

# Next heading

text
`;

  const expected = `# Target

text

## Sub-heading

sub-heading text
`;

  const mdastRoot = fromMarkdown(input);

  const headingWithChildren = findHeadingWithChildren(mdastRoot, "Target");

  isNotVoid(headingWithChildren);

  expect(toMarkdown(headingWithChildren)).toBe(expected);
});

test("Sort lists recursively", () => {
  const input = `- b
- c
    - a
    - c
    - b
- a
`;

  const expected = `- a
- b
- c
    - a
    - b
    - c
`;

  const tree = fromMarkdown(input);
  const list = tree.children[0];
  const actual = toMarkdown(sortListsRecursively(list));

  expect(actual).toBe(expected);
});

test("Sort lists by time", () => {
  const input = `- 10:00 - 11:00 b
- No time
- 09:00 - 10:00 a
- 11:00 - 12:00 c
- 13:00 d
`;

  const expected = `- 09:00 - 10:00 a
- 10:00 - 11:00 b
- 11:00 - 12:00 c
- 13:00 d
- No time
`;

  const tree = fromMarkdown(input);
  const list = tree.children[0];
  const actual = toMarkdown(
    sortListsRecursively(list, compareByTimestampInText),
  );

  expect(actual).toBe(expected);
});
