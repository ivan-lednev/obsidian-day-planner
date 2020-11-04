export const HEADING_REGEX = /^[#\s-]*/;
export const HEADING_FORMAT = '#';

export const DEFAULT_DATE_FORMAT = 'YYYYMMDD';
export const DATE_REGEX = /(?<target>{{date:?(?<date>[^}]*)}})/g;

export const DAY_PLANNER_FILENAME = 'Day Planner-{{date}}.md';

//https://regex101.com/r/FClNLv/2
export const PLAN_PARSER_REGEX = 
/^((-?[\s]*\[?(?<completion>[x ]*)\])?(\d.)?\s*?(?<hours>\d{2}):(?<minutes>\d{2})\s)((?<break>BREAK)|(?<end>END|finish)|((?<text>.*)))$/gmi;

export const PLAN_ITEM_REGEX = /\[(x| )*\] \d{2}:\d{2}/;

//https://regex101.com/r/v17LhX/9
export const CURRENT_ITEM_REGEX = /\n*((---\s*)?(## Current Task)|(\s*---))/gmi;

//https://regex101.com/r/QG6cg4/1
export const CURRENT_ITEM_PROGRESS_REGEX = /((\n*\|{2}\d{2}:\d{2}\|{2}(->)*(_ )*\|{2}\d{2}:\d{2}\|{2}))/gmi;

export const DAY_PLANNER_DEFAULT_CONTENT =
`# Day Planner
- [ ]
`