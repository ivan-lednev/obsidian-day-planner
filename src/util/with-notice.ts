import { Notice } from "obsidian";

// todo: use inferred type
export function withNotice<T, U>(fn: (...args: T[]) => U | Promise<U>) {
  return async (...args: T[]) => {
    try {
      await fn(...args);
    } catch (error: unknown) {
      console.error(error);

      if (error instanceof Error) {
        new Notice(error.message);
      } else {
        new Notice(String(error));
      }
    }
  };
}
