import { fromMarkdown } from "mdast-util-from-markdown";

import { toMarkdown } from "./mdast";

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

test.todo("extract a task");

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
