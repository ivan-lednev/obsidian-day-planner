export const content = `# Day planner
- 9:00 1
\t- 1.1
\t- 1.2
- 10:00 2
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
          line: 4,
          col: 9,
          offset: 46,
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
          col: 8,
          offset: 22,
        },
      },
      parent: -1,
    },
    {
      position: {
        start: {
          line: 2,
          col: 1,
          offset: 24,
        },
        end: {
          line: 2,
          col: 6,
          offset: 29,
        },
      },
      parent: 1,
    },
    {
      position: {
        start: {
          line: 3,
          col: 1,
          offset: 31,
        },
        end: {
          line: 3,
          col: 6,
          offset: 36,
        },
      },
      parent: 1,
    },
    {
      position: {
        start: {
          line: 4,
          col: 0,
          offset: 37,
        },
        end: {
          line: 4,
          col: 9,
          offset: 46,
        },
      },
      parent: -1,
    },
  ],
};
