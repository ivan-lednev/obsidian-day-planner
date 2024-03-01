export function withPerformanceReport<T>(
  fn: () => T,
  variables: Record<string, string> = {},
) {
  performance.mark("op-start");
  const result = fn();
  performance.mark("op-end");

  const { duration } = performance.measure("op-time", "op-start", "op-end");

  const formattedVariables = Object.entries(variables)
    .map(([key, value]) => `${key}: ${value || "empty"}`)
    .join("\n  ");

  console.debug(`obsidian-day-planner:
  took: ${duration.toFixed(2)} ms
  ${formattedVariables}
  `);

  return result;
}
