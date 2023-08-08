export const content = `- List item
# Day planner
- 10:00 Wake up
`;

export const metadata = {
  headings: [
    {
      position: {
        start: {
          line: 1,
          col: 0,
          offset: 12,
        },
        end: {
          line: 1,
          col: 13,
          offset: 25,
        },
      },
      heading: "Day planner",
      level: 1,
    },
  ],
  sections: [
    {
      type: "list",
      position: {
        start: {
          line: 0,
          col: 0,
          offset: 0,
        },
        end: {
          line: 0,
          col: 11,
          offset: 11,
        },
      },
    },
    {
      type: "heading",
      position: {
        start: {
          line: 1,
          col: 0,
          offset: 12,
        },
        end: {
          line: 1,
          col: 13,
          offset: 25,
        },
      },
    },
    {
      type: "list",
      position: {
        start: {
          line: 2,
          col: 0,
          offset: 26,
        },
        end: {
          line: 3,
          col: 1,
          offset: 43,
        },
      },
    },
  ],
  listItems: [
    {
      position: {
        start: {
          line: 0,
          col: 0,
          offset: 0,
        },
        end: {
          line: 0,
          col: 11,
          offset: 11,
        },
      },
      parent: -1,
    },
    {
      position: {
        start: {
          line: 2,
          col: 0,
          offset: 26,
        },
        end: {
          line: 3,
          col: 1,
          offset: 43,
        },
      },
      parent: -2,
    },
  ],
};
