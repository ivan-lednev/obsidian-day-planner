- [General guidelines](#general-guidelines)
- [Testing guidelines](#testing-guidelines)
  - [There are no unit tests for UI](#there-are-no-unit-tests-for-ui)
  - [There are no E2E tests](#there-are-no-e2e-tests)
- [UI, Svelte guidelines](#ui-svelte-guidelines)
  - [Pull all the logic from components into custom stores](#pull-all-the-logic-from-components-into-custom-stores)

## General guidelines

- Maximize immutability
  - Reason: immutable code is easier to understand and debug
  - Limit mutation to the minimal needed scope (function)
- Prefer functions/closures over ES6 classes
- Clear self-explanatory code is better than comments
  - Try to follow the philosophy expressed in Clean Code: the code should be simple and clear enough to explain itself. If you need comments to express something, it's likely that your code may be improved to be more clear
- TypeScript is better than comments
  - If you can express an interface or a constraint in TypeScript, it is better than writing comments

## Testing guidelines

- There are no unit tests for UI
  - This is because svelte-testing-library is not very good, and js-dom is not a good fit for testing things like drag-and-drop.
- There are no E2E tests
  - There is no easy way to write E2E tests for an Obsidian plugin, so we don't do those.

## UI, Svelte guidelines

- Pull all the logic from components into custom stores
  - Reason: this makes testing much easier
  - Hooks are custom Svelte stores. They let you 'hook into' Svelte's reactive system. I brought this naming convention from React, because it's simple and useful. A hook is any function that manipulates stores. It starts with `use`, like `useEditContext`.
