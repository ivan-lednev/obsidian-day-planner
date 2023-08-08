export const content = `# Day planner
- 10 Wake up
## Subheading
- 11 Grab a brush and put a little make up
`;

export const metadata = {
  headings: [
    {
      position: {
        start: {
          line: 0,
          col: 0,
          offset: 0,
        },
        end: {
          line: 0,
          col: 13,
          offset: 13,
        },
      },
      heading: "Day planner",
      level: 1,
    },
    {
      position: {
        start: {
          line: 2,
          col: 0,
          offset: 27,
        },
        end: {
          line: 2,
          col: 13,
          offset: 40,
        },
      },
      heading: "Subheading",
      level: 2,
    },
  ],
  sections: [
    {
      type: "heading",
      position: {
        start: {
          line: 0,
          col: 0,
          offset: 0,
        },
        end: {
          line: 0,
          col: 13,
          offset: 13,
        },
      },
    },
    {
      type: "list",
      position: {
        start: {
          line: 1,
          col: 0,
          offset: 14,
        },
        end: {
          line: 1,
          col: 12,
          offset: 26,
        },
      },
    },
    {
      type: "heading",
      position: {
        start: {
          line: 2,
          col: 0,
          offset: 27,
        },
        end: {
          line: 2,
          col: 13,
          offset: 40,
        },
      },
    },
    {
      type: "list",
      position: {
        start: {
          line: 3,
          col: 0,
          offset: 41,
        },
        end: {
          line: 3,
          col: 42,
          offset: 83,
        },
      },
    },
  ],
  listItems: [
    {
      position: {
        start: {
          line: 1,
          col: 0,
          offset: 14,
        },
        end: {
          line: 1,
          col: 12,
          offset: 26,
        },
      },
      parent: -1,
    },
    {
      position: {
        start: {
          line: 3,
          col: 0,
          offset: 41,
        },
        end: {
          line: 3,
          col: 42,
          offset: 83,
        },
      },
      parent: -3,
    },
  ],
};
