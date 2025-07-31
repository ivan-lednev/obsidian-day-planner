- [Contributing](#contributing)
  - [Before development](#before-development)
  - [How to set up a development environment](#how-to-set-up-a-development-environment)
  - [Submitting a pull-request](#submitting-a-pull-request)
  - [Development guidelines](#development-guidelines)
    - [General guidelines](#general-guidelines)
    - [Testing guidelines](#testing-guidelines)
    - [UI, Svelte guidelines](#ui-svelte-guidelines)

# Contributing

This document describes how to make a code contribution to the repo.

## Before development

1. When contributing, please first discuss the change via an [issue](https://github.com/ivan-lednev/obsidian-day-planner/issues).
2. Read through the [development guidelines](#development-guidelines) to make sure your code matches the style of the repo.

## How to set up a development environment

1. Fork the repo: https://github.com/ivan-lednev/obsidian-day-planner
1. Create a test vault and go to the plugins directory: `cd <your-vault>/.obsidian/plugins`
1. Clone your fork: `git clone https://github.com/ivan-lednev/obsidian-day-planner`
1. Move to the folder: `cd obsidian-day-planner`
1. Install dependencies: `npm install`
1. Watch the changes: `npm run dev`
1. Now when you change anything, reload Obsidian to see the updates
   - You can use https://github.com/pjeby/hot-reload to make this process faster
1. We don't want the repo to turn into a mess, so...
   1. Before committing, format your code with `npm run format`. If you don't, the PR pipeline is going to mark the PR as failed once the maintainer triggers the PR workflow
   1. Once you're ready to commit, make sure your commit message conforms to the [conventional commits spec](https://www.conventionalcommits.org/en/v1.0.0/) (pre-commit hook is going to fail otherwise)

## Submitting a pull-request

1. Avoid noisy changes like formatting or refactoring that's unrelated to your change. It makes review harder
1. Where appropriate, update the README.md with details of changes to the plugin, this includes additions and changes to configuration settings, plugin commands, useful file locations and additional installation instructions.
1. If you can, please include tests in your Pull Request, particularly if you are making significant changes or additions to the behavior of the plugin.
1. The repository maintainer will be responsible for increasing the version numbers in files and the README.md to the new version that this Pull Request would represent once it has been completed and merged.

## Development guidelines

### General guidelines

- Maximize immutability
  - Reason: immutable code is easier to understand and debug
  - Limit mutation to the minimal needed scope (function)
- Prefer functions/closures over ES6 classes
- Clear self-explanatory code is better than comments
  - Try to follow the philosophy expressed in Clean Code: the code should be simple and clear enough to explain itself. If you need comments to express something, it's likely that your code may be improved to be more clear
- TypeScript is better than comments
  - If you can express an interface or a constraint in TypeScript, it is better than writing comments

### Testing guidelines

- There are no unit tests for UI
  - This is because svelte-testing-library is not very good, and js-dom is not a good fit for testing things like drag-and-drop.
- There are no E2E tests
- There is no easy way to write E2E tests for an Obsidian plugin, so we don't do those.
- `fixtures/` contains ICAL, markdown files & metadata on these files for integration tests. This allows us to use real Obsidian & Dataview to produce metadata on these files instead of writing it all by hand. You can update corresponding Dataview fixtures manually:
  1.  Build the plugin in dev mode
  2.  Copy `fixture-vault` into an Obsidian vault: `cp fixture-vault <obsidian>`. If you cloned the project into a test vault, just run: `cp -r fixtures/fixture-vault/ ../../../fixtures/`
  3.  Open your Obsidian test vault and run the command: `Dump metadata`

### UI, Svelte guidelines

- Use redux-toolkit for new features
- Pull as much logic as possible from components. This makes testing much easier
- Do not mix stores and runes
- Do not use deprecated reactivity APIs (e.g. reactive blocks (`$:`))
