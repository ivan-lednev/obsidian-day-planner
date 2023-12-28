import { identity } from "lodash/fp";

type IdentityGetters<T> = Partial<{
  [Prop in keyof T]: (value: T[Prop]) => string;
}>;

/**
 * Detect change in an object using custom identity functions for each object prop if needed
 *
 * @param initialProps
 * @param identityGetters
 */
// TODO: figure out how to make TypeScript happy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMemo<T extends Record<string, any>>(
  initialProps: T,
  identityGetters: IdentityGetters<T>,
) {
  let previousProps = initialProps;

  function shouldUpdate(newProps: T) {
    for (const [propKey, propValue] of Object.entries(newProps)) {
      const previousValue = previousProps[propKey];
      const identityFn = identityGetters?.[propKey] || identity;
      const propChanged = identityFn(propValue) !== identityFn(previousValue);

      if (propChanged) {
        previousProps = newProps;

        return true;
      }
    }

    return false;
  }

  return shouldUpdate;
}
