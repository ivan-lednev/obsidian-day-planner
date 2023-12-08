export function withPerformance<T>(fn: () => T) {
  performance.mark("query-start");
  const result = fn();
  performance.mark("query-end");

  const { duration } = performance.measure(
    "query-time",
    "query-start",
    "query-end",
  );

  return { result, duration };
}

export function reportQueryPerformance(source: string, duration: number) {
  return `obsidian-day-planner:
  source: "${source}"
  took: ${duration.toFixed(2)} ms`;
}
