import type { Action, Selector } from "@reduxjs/toolkit";

export function createSelectorChangePredicate<T, U>(selector: Selector<T, U>) {
  let previous: object | U = {} as const;

  return (action: Action, currentState: T) => {
    const next = selector(currentState);

    if (previous !== next) {
      previous = next;

      return true;
    }

    return false;
  };
}
