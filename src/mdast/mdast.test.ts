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

  expect(toMarkdown(fromMarkdown(input))).toEqual(input);
});
