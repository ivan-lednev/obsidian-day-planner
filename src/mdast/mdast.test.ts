import { findNodeAtPoint, fromMarkdown, toMarkdown } from "./mdast";

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
    searchedNodeType: "list",
  });

  expect(listNode).toBeDefined();
  expect(toMarkdown(listNode)).toBe(listInput + "\n");
});

// function addTaskUnderHeading(root: Root, addition: Root) {}
//
// test("add a task under a present heading", () => {
//   const contents = `# Plan
//
// - [ ] 10:00 - 11:00 Wake up
// `;
//   const newTask = "- [ ] 11:00 - 12:00 Eat";
//
//   const parsed = fromMarkdown(contents);
//   const parsedTask = fromMarkdown(newTask);
//
//   const result = addTaskUnderHeading(parsed, parsedTask);
// });
//
// function sortByTime(list: List) {
//   const now = window.moment();
//   const sorted = list.children.slice().sort((a, b) => {
//     const aTime = parseTimestamp(toMarkdown(a), now);
//     const bTime = parseTimestamp(toMarkdown(b), now);
//
//     return aTime.isBefore(bTime) ? -1 : 1;
//   });
//
//   return {
//     ...list,
//     children: sorted,
//   };
// }
//
// test("sort tasks by time", () => {
//   const contents = `- [ ] 10:00 Wake up
// - [ ] 9:00 Sweet dreams
// `;
//
//   const result = `- [ ] 9:00 Sweet dreams
// - [ ] 10:00 Wake up
// `;
//
//   const parsed = fromMarkdown(contents);
//   const list = parsed.children[0];
//   const sorted = sortByTime(list);
//
//   expect(toMarkdown(sorted)).toEqual(result);
// });
