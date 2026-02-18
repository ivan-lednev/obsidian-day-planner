import type { LocalTask, RemoteTask } from "../task-types";

const matches = (fields: string[], patterns: string[]) =>
  patterns.some(
    (p) =>
      p.trim() && fields.some((f) => f.toLowerCase().includes(p.toLowerCase())),
  );

export const localTaskMatchesAnyPattern = (
  task: LocalTask,
  patterns: string[],
) => matches([task.text], patterns);

export const remoteTaskMatchesAnyPattern = (
  task: RemoteTask,
  patterns: string[],
) =>
  matches(
    [task.summary, task.description, task.location].filter(Boolean) as string[],
    patterns,
  );
