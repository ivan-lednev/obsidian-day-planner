import { propRegexp } from "../regexp";

export function createProp(
  key: string,
  value: string,
  type: "default" | "keyless" = "default",
) {
  if (type === "default") {
    return `[${key}::${value}]`;
  }

  return `(${key}::${value})`;
}

export function updateProp(
  line: string,
  updateFn: (previous: string) => string,
) {
  const match = [...line.matchAll(propRegexp)];

  if (match.length === 0) {
    throw new Error(`Did not find a prop in line: '${line}'`);
  }

  const captureGroups = match[0];
  const [, key, previousValue] = captureGroups;

  return `[${key}::${updateFn(previousValue)}]`;
}

export function deleteProps(text: string) {
  return text.replaceAll(propRegexp, "").trim();
}
