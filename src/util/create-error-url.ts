export function createErrorUrl(error: Error) {
  const asMarkdown = `
<!-- Don't forget to add a descriptive title! -->

Steps to reproduce:
1. 

Error log:
\`\`\`log
${error.stack}
\`\`\`

Other relevant details:
`;

  const encoded = encodeURI(asMarkdown);

  return `https://github.com/ivan-lednev/obsidian-day-planner/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&body=${encoded}`;
}
