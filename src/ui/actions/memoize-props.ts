import { identity } from "lodash/fp";

type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];

type IdentityGetters<T> = Partial<{
  [Prop in keyof T]: (value: T[Prop]) => string;
}>;

/**
 * Detect change in an object using custom identity functions for each object prop if needed
 *
 * @param initialProps
 * @param identityGetters
 */
export function createMemo<PropsType>(
  initialProps: PropsType,
  identityGetters: IdentityGetters<PropsType>,
) {
  let previousProps: PropsType = initialProps;

  function shouldUpdate(newProps: PropsType) {
    for (const [propKey, propValue] of Object.entries(
      // @ts-ignore
      newProps,
    ) as Entries<PropsType>) {
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
