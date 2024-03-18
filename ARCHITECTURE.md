- [General guidelines](#general-guidelines)
- [Testing guidelines](#testing-guidelines)
  - [No unit tests for UI](#no-unit-tests-for-ui)
  - [No E2E tests](#no-e2e-tests)
- [UI, Svelte guidelines](#ui-svelte-guidelines)
  - [Pull all the logic from components into custom stores](#pull-all-the-logic-from-components-into-custom-stores)

The app is not that big, so there aren't that many guidelines to follow.

## General guidelines

- Maximize immutability. Immutable code is easier to understand and debug
- Prefer functions/closures over ES6 classes

## Testing guidelines

### No unit tests for UI

This is because svelte-testing-library is not very good, and js-dom is not a good fit for testing things like drag-and-drop.

### No E2E tests

There is no easy way to write E2E tests for an Obsidian plugin, so we don't do those.

## UI, Svelte guidelines

### Pull all the logic from components into custom stores

Hooks are custom Svelte stores. They let you 'hook into' Svelte's reactive system. I brought this naming convention from React, because it's simple and useful. A hook is any function that manipulates stores. It starts with `use`, like `useEditContext`.

All the logic should be pulled from Svelte components into hooks to make testing easy.
