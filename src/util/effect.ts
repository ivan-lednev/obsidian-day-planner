import { Effect, pipe } from "effect";
import { Notice } from "obsidian";

export const runWithNoticeOnError = <A, E>(
  program: Effect.Effect<A, E>,
): Promise<void> =>
  pipe(
    program,
    Effect.asVoid,
    Effect.catchAll((error) =>
      Effect.sync(() => {
        new Notice(String(error));

        console.error(error);
      }),
    ),
    Effect.runPromise,
  );
