import { Effect, pipe } from "effect";
import { Notice } from "obsidian";

/**
 * Runs the program, telling the user about a failure. Resolves to whether it
 * succeeded, so callers that have something to roll back can react.
 */
export const runWithNoticeOnError = <A, E>(
  program: Effect.Effect<A, E>,
): Promise<boolean> =>
  pipe(
    program,
    Effect.as(true),
    Effect.catchAll((error) =>
      Effect.sync(() => {
        new Notice(String(error));

        console.error(error);

        return false;
      }),
    ),
    Effect.runPromise,
  );
