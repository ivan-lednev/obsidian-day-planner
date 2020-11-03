export const HEADING_REGEX = /^[#\s-]*/;
export const HEADING_FORMAT = '#';

export const DEFAULT_DATE_FORMAT = 'YYYYMMDDHHmm';
export const DATE_REGEX = /(?<target>{{date:?(?<date>[^}]*)}})/g;

export const DAY_PLANNER_FILENAME = 'Day Planner.md';
export const PLAN_PARSER_REGEX = 
/^((-?[\s]*\[?(?<completion>[x ]*)\])?(\d.)?\s*?(?<hours>\d{2}):(?<minutes>\d{2})\s)((?<break>BREAK)|(?<end>END|finish)|((?<text>.*)))$/gmi;