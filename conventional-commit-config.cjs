function capitalize(input) {
  return `${input.slice(0, 1).toLocaleUpperCase()}${input.slice(1)}`;
}

module.exports = {
  parserOpts: {
    headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
    headerCorrespondence: ["type", "scope", "subject"]
  },
  writerOpts: {
    transform: (commit, context) => {
      if (
        (commit.type === "feat" || commit.type === "fix") &&
        commit.scope === "public"
      ) {
        return {
          ...commit, subject: capitalize(commit.subject), scope: "",
          body: "hren"
        };
      }
      return false;
    },
    commitPartial: `### {{#if subject}}{{subject}}{{/if}}
{{#if body}}\n\n{{body}}\n{{/if}}
`,
//     mainTemplate: `{{> header}}
//
// {{#each commitGroups}}
// {{#each commits}}
// {{> commit root=@root}}
// {{/each}}
// {{/each}}
//
// {{> footer}}`
  }
};
