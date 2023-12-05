## Testing

### Unit tests

All the logic should be pulled from Svelte components into hooks to make testing easy. This is because svelte-testing-library is not very good, and js-dom is not a good fit for testing things like drag-and-drop.

### E2E tests

There is no easy way to write E2E tests for an Obsidian plugin.

## UI, Svelte

### Hooks (custom stores)

Hooks are custom Svelte stores. They let you 'hook into' Svelte's reactive system. I brought this naming convention from React, because it's simple and useful.

A hook is any function that manipulates stores. It starts with `use`, like `useEditContext`.
