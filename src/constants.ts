export const DEFAULT_DATE_FORMAT = 'YYYYMMDD';
export const DATE_REGEX = /(?<target>{{date:?(?<date>[^}]*)}})/g;

export const DAY_PLANNER_FILENAME = 'Day Planner-{{date}}.md';

//https://regex101.com/r/VAxRnc/8
export const PLAN_PARSER_REGEX_CREATOR = (breakLabel: string, endLabel: string) =>
  new RegExp('^(((-?[\\s]*\\[?(?<completion>[x ]*)\\])(\\d.)?\\s*?(?<hours>\\d{1,2}):(?<minutes>\\d{2})\\s(((-){1,2}|–)\\s(?<endHours>\\d{1,2}):(?<endMinutes>\\d{2}))?)((?<break>' + breakLabel + '[\\n ]?)|(?<end>' + endLabel + '[\\n ]?)|((?<text>.*))))$', 'gmi');

export const MERMAID_REGEX = /```mermaid\ngantt[\S\s]*?```\s*/gmi;

export const DAY_PLANNER_DEFAULT_CONTENT =
`## Day Planner
- [ ] `

export const VIEW_TYPE_TIMELINE = 'timeline';
export const MINUTE_MULTIPLIER = 4;

export const ICONS = [
  'any-key',
  'audio-file',
  'blocks',
  'broken-link',
  'bullet-list',
  'calendar-with-checkmark',
  'checkmark',
  'create-new',
  'cross',
  'cross-in-box',
  'crossed-star',
  'dice',
  'document',
  'documents',
  'dot-network',
  'enter',
  'expand-vertically',
  'filled-pin',
  'folder',
  'gear',
  'go-to-file',
  'hashtag',
  'help',
  'horizontal-split',
  'image-file',
  'info',
  'install',
  'languages',
  'left-arrow',
  'left-arrow-with-tail',
  'lines-of-text',
  'link',
  'logo-crystal',
  'magnifying-glass',
  'microphone',
  'microphone-filled',
  'open-vault',
  'pane-layout',
  'paper-plane',
  'pdf-file',
  'pencil',
  'pin',
  'popup-open',
  'presentation',
  'reset',
  'right-arrow',
  'right-arrow-with-tail',
  'right-triangle',
  'search',
  'sheets-in-box',
  'star',
  'star-list',
  'switch',
  'three-horizontal-bars',
  'trash',
  'two-columns',
  'up-and-down-arrows',
  'uppercase-lowercase-a',
  'vault',
  'vertical-split',
  'vertical-three-dots'
]