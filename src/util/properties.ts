import { isNotVoid } from "typed-assert";

import { propRegexp } from "../regexp";

export function createProp(key: string, value: string) {
  return `[${key}::${value}]`;
}

export function updateProp(
  line: string,
  updateFn: (previous: string) => string,
) {
  const match = propRegexp.exec(line);

  isNotVoid(match);

  const [, key, previous] = match;

  return `[${key}::${updateFn(previous)}]`;
}

export function deleteProps(line: string) {
  return line.replaceAll(propRegexp, "").trim();
}
