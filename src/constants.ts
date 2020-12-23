export const DEFAULT_DATE_FORMAT = 'YYYYMMDD';
export const DATE_REGEX = /(?<target>{{date:?(?<date>[^}]*)}})/g;

export const DAY_PLANNER_FILENAME = 'Day Planner-{{date}}.md';

//https://regex101.com/r/VAxRnc/8
export const PLAN_PARSER_REGEX = 
/^(((-?[\s]*\[?(?<completion>[x ]*)\])(\d.)?\s*?(?<hours>\d{1,2}):(?<minutes>\d{2})\s)((?<break>BREAK[\n ]?)|(?<end>END[\n ]?)|((?<text>.*))))$/gmi;

export const MERMAID_REGEX = /```mermaid\ngantt[\S\s]*?```\s*/gmi;

export const DAY_PLANNER_DEFAULT_CONTENT =
`## Day Planner
- [ ] `

export const VIEW_TYPE_TIMELINE = 'timeline';
export const MINUTE_MULTIPLIER = 4;