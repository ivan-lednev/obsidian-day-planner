const ulToken = `[-*+]`;
const olToken = `\\d+\\.`;
const listToken = `\\s*(${ulToken}|${olToken})\\s+`;

const checkbox = `\\s*\\[(?<completion>[^\\]])]\\s+`;

const durationSeparator = `\\s*-{1,2}\\s*`;

const hours = `\\d{1,2}`;
const minutes = `\\d{2}`;
const hourMinuteSeparator = `[:. ]`;

const date = "\\d{4}-\\d{2}-\\d{2}";

const time = `(${hours})(?:${hourMinuteSeparator}?(${minutes}))?\\s*([apAP][mM](?!\\w))?`;

export const listTokenRegExp = new RegExp(listToken);
export const checkboxRegExp = new RegExp(checkbox);
export const timeRegExp = new RegExp(time);
export const timeFromStartRegExp = new RegExp(`^${time}`);
export const timestampRegExp = new RegExp(
  `^(?<times>(?<start>${time})(?:${durationSeparator}(?<end>${time}))?)(?<text>.+)$`,
  "im",
);

export const sTaskTimestampRegExp = new RegExp(
  `^(?<start>${time})(?:${durationSeparator}(?<end>${time}))?$`,
  "im",
);

export const scheduledPropRegExp = new RegExp(
  `(\\[scheduled\\s*::\\s*)${date}(\\])`,
);

export const keylessScheduledPropRegExp = new RegExp(
  `(\\(scheduled\\s*::\\s*)${date}(\\))`,
);

export const shortScheduledPropRegExp = new RegExp(`(⏳\\s*)${date}`);

export const propRegexp = /\[(.+)::(.*)]/g;
